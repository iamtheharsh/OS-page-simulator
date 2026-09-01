// ============================================================
// simulator.js — CORE ALGORITHM ENGINE
// ============================================================
// This file contains ALL the page replacement algorithm logic.
// Every function here is a PURE FUNCTION utilizing EFFICIENT
// DATA STRUCTURES (Hash Maps, Doubly Linked Lists, Queues):
//
//   - Hash Maps (Map / Set) for O(1) page presence lookup
//   - Doubly Linked Lists for O(1) LRU eviction and MRU promotion
//   - Queues / Circular buffers for O(1) FIFO tracking
//
// Return shape of every algorithm:
//   Array of step objects:
//   [
//     { page: 7, fault: true,  frames: [7, -1, -1] },
//     { page: 0, fault: true,  frames: [7,  0, -1] },
//     { page: 7, fault: false, frames: [7,  0, -1] }, // HIT
//     ...
//   ]
//   • page   → the page number accessed at this step
//   • fault  → true = PAGE FAULT, false = PAGE HIT
//   • frames → snapshot of all memory frames at this step
//              (-1 means the frame slot is empty)
// ============================================================


// ────────────────────────────────────────────────────────────
// parsePages — INPUT SANITIZER
// ────────────────────────────────────────────────────────────
// Converts the user's raw text input into a clean integer array.
// Accepts flexible formats: "7,0,1,2", "7 0 1 2", "7, 0, 1, 2"
// ────────────────────────────────────────────────────────────
export const parsePages = (pagesStr) => {
  return pagesStr
    .replace(/[^0-9, ]/g, '') // Step 1: sanitize
    .split(/[ ,]+/)            // Step 2: split
    .filter((s) => s.trim() !== '') // Step 3: remove empty tokens
    .map(Number);              // Step 4: convert to integers
};


// ────────────────────────────────────────────────────────────
// DOUBLY LINKED LIST DATA STRUCTURE (For O(1) LRU Operations)
// ────────────────────────────────────────────────────────────
class DLLNode {
  constructor(page, frameIdx) {
    this.page = page;
    this.frameIdx = frameIdx;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    // Sentinel / dummy head (MRU) and tail (LRU)
    this.head = new DLLNode(-1, -1);
    this.tail = new DLLNode(-1, -1);
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  // Insert node right after head in O(1) (marks as Most Recently Used)
  insertAtHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
    this.size++;
  }

  // Remove an arbitrary node in O(1)
  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
    this.size--;
  }

  // Move existing node to head in O(1) on cache hit
  moveToHead(node) {
    this.removeNode(node);
    this.insertAtHead(node);
  }

  // Remove and return the node before tail in O(1) (Least Recently Used)
  removeTail() {
    if (this.size === 0) return null;
    const lruNode = this.tail.prev;
    this.removeNode(lruNode);
    return lruNode;
  }
}


// ────────────────────────────────────────────────────────────
// simulateFIFO — First In, First Out
// ────────────────────────────────────────────────────────────
// Data Structures Used:
//   - Hash Map (pageToFrame Map) for O(1) page hit checks
//   - Circular pointer / FIFO queue for O(1) victim selection
// ────────────────────────────────────────────────────────────
export const simulateFIFO = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const result = [];
  
  // Hash Map for O(1) page lookup: page -> frame index
  const pageToFrame = new Map();
  let replaceIndex = 0;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const hit = pageToFrame.has(p);
    const fault = !hit;

    if (fault) {
      // If replacing an existing page, remove old entry from Hash Map
      const oldPage = mem[replaceIndex];
      if (oldPage !== -1) {
        pageToFrame.delete(oldPage);
      }

      // Load new page into FIFO slot & register in Hash Map in O(1)
      mem[replaceIndex] = p;
      pageToFrame.set(p, replaceIndex);

      // Advance circular pointer in O(1)
      replaceIndex = (replaceIndex + 1) % numFrames;
    }

    result.push({
      page: p,
      fault: fault,
      frames: [...mem],
    });
  }
  return result;
};


// ────────────────────────────────────────────────────────────
// simulateOptimal — Optimal Page Replacement (OPR / Bélády's)
// ────────────────────────────────────────────────────────────
// Data Structures Used:
//   - Hash Map (pageToFrame Map) for O(1) hit verification
//   - Future occurrence scan to identify farthest future reference
// ────────────────────────────────────────────────────────────
export const simulateOptimal = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const pageToFrame = new Map();
  const result = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const hit = pageToFrame.has(p);
    const fault = !hit;

    if (fault) {
      let emptyIdx = mem.indexOf(-1);

      if (emptyIdx !== -1) {
        // Free frame available
        mem[emptyIdx] = p;
        pageToFrame.set(p, emptyIdx);
      } else {
        // Cache full: look ahead to find optimal victim
        let replaceIdx = -1;
        let farthest = -1;

        for (let j = 0; j < numFrames; j++) {
          let nextUse = Infinity;
          for (let k = i + 1; k < pages.length; k++) {
            if (pages[k] === mem[j]) {
              nextUse = k;
              break;
            }
          }

          if (nextUse > farthest) {
            farthest = nextUse;
            replaceIdx = j;
          }
        }

        // Evict optimal victim & update Hash Map in O(1)
        const victimPage = mem[replaceIdx];
        pageToFrame.delete(victimPage);

        mem[replaceIdx] = p;
        pageToFrame.set(p, replaceIdx);
      }
    }

    result.push({
      page: p,
      fault: fault,
      frames: [...mem],
    });
  }
  return result;
};


// ────────────────────────────────────────────────────────────
// simulateLRU — Least Recently Used (O(1) Map + Doubly Linked List)
// ────────────────────────────────────────────────────────────
// Data Structures Used:
//   1. Hash Map (pageMap: page -> DLLNode): O(1) lookup
//   2. Doubly Linked List (dll): O(1) update to MRU head & O(1) LRU eviction
// ────────────────────────────────────────────────────────────
export const simulateLRU = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const result = [];

  // Hash Map (page -> Node) & Doubly Linked List for optimal O(1) operations
  const pageMap = new Map();
  const dll = new DoublyLinkedList();
  let nextFreeFrame = 0;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const hit = pageMap.has(p);
    const fault = !hit;

    if (hit) {
      // O(1) Cache Hit: Promote node to Most Recently Used (head)
      const node = pageMap.get(p);
      dll.moveToHead(node);
    } else {
      // Cache Fault
      if (dll.size < numFrames) {
        // Free frame available
        const frameIdx = nextFreeFrame++;
        mem[frameIdx] = p;
        const newNode = new DLLNode(p, frameIdx);
        dll.insertAtHead(newNode);
        pageMap.set(p, newNode);
      } else {
        // Memory full: Evict LRU node from tail in O(1)
        const victim = dll.removeTail();
        pageMap.delete(victim.page);

        // Place new page in victim's frame slot
        const frameIdx = victim.frameIdx;
        mem[frameIdx] = p;

        // Insert new node at MRU position (head) in O(1)
        const newNode = new DLLNode(p, frameIdx);
        dll.insertAtHead(newNode);
        pageMap.set(p, newNode);
      }
    }

    result.push({
      page: p,
      fault: fault,
      frames: [...mem],
    });
  }
  return result;
};


// ────────────────────────────────────────────────────────────
// simulateLFU — Least Frequently Used
// ────────────────────────────────────────────────────────────
// Data Structures Used:
//   - Hash Map (pageToFrame Map) for O(1) page access lookup
//   - Frequency array & insertion timestamps for FIFO tie-breaking
// ────────────────────────────────────────────────────────────
export const simulateLFU = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const freq = Array(numFrames).fill(0);
  const insertTime = Array(numFrames).fill(-1);
  const pageToFrame = new Map();
  const result = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const hit = pageToFrame.has(p);
    const fault = !hit;

    if (hit) {
      const hitIdx = pageToFrame.get(p);
      freq[hitIdx]++;
    } else {
      let emptyIdx = mem.indexOf(-1);

      if (emptyIdx !== -1) {
        mem[emptyIdx] = p;
        freq[emptyIdx] = 1;
        insertTime[emptyIdx] = i;
        pageToFrame.set(p, emptyIdx);
      } else {
        let lfuIdx = 0;

        for (let j = 1; j < numFrames; j++) {
          if (freq[j] < freq[lfuIdx]) {
            lfuIdx = j;
          } else if (freq[j] === freq[lfuIdx]) {
            // Tie break with FIFO
            if (insertTime[j] < insertTime[lfuIdx]) {
              lfuIdx = j;
            }
          }
        }

        const victimPage = mem[lfuIdx];
        pageToFrame.delete(victimPage);

        mem[lfuIdx] = p;
        freq[lfuIdx] = 1;
        insertTime[lfuIdx] = i;
        pageToFrame.set(p, lfuIdx);
      }
    }

    result.push({
      page: p,
      fault: fault,
      frames: [...mem],
    });
  }
  return result;
};


// ────────────────────────────────────────────────────────────
// simulateMFU — Most Frequently Used
// ────────────────────────────────────────────────────────────
// Data Structures Used:
//   - Hash Map (pageToFrame Map) for O(1) page access lookup
//   - Frequency counter & insertion timestamps for FIFO tie-breaking
// ────────────────────────────────────────────────────────────
export const simulateMFU = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const freq = Array(numFrames).fill(0);
  const insertTime = Array(numFrames).fill(-1);
  const pageToFrame = new Map();
  const result = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const hit = pageToFrame.has(p);
    const fault = !hit;

    if (hit) {
      const hitIdx = pageToFrame.get(p);
      freq[hitIdx]++;
    } else {
      let emptyIdx = mem.indexOf(-1);

      if (emptyIdx !== -1) {
        mem[emptyIdx] = p;
        freq[emptyIdx] = 1;
        insertTime[emptyIdx] = i;
        pageToFrame.set(p, emptyIdx);
      } else {
        let mfuIdx = 0;

        for (let j = 1; j < numFrames; j++) {
          if (freq[j] > freq[mfuIdx]) {
            mfuIdx = j;
          } else if (freq[j] === freq[mfuIdx]) {
            // Tie break with FIFO
            if (insertTime[j] < insertTime[mfuIdx]) {
              mfuIdx = j;
            }
          }
        }

        const victimPage = mem[mfuIdx];
        pageToFrame.delete(victimPage);

        mem[mfuIdx] = p;
        freq[mfuIdx] = 1;
        insertTime[mfuIdx] = i;
        pageToFrame.set(p, mfuIdx);
      }
    }

    result.push({
      page: p,
      fault: fault,
      frames: [...mem],
    });
  }
  return result;
};
