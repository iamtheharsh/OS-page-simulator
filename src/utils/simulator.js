/**
 * Parses a comma or space separated string of numbers into an array of integers.
 */
export const parsePages = (pagesStr) => {
  return pagesStr
    .replace(/[^0-9, ]/g, '') // sanitize
    .split(/[ ,]+/)
    .filter((s) => s.trim() !== '')
    .map(Number);
};

export const simulateFIFO = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const result = [];
  let replaceIndex = 0;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    let hit = false;
    for (let frame of mem) {
      if (frame === p) {
        hit = true;
        break;
      }
    }

    const fault = !hit;
    if (fault) {
      mem[replaceIndex] = p;
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

export const simulateOptimal = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const result = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    let hit = false;
    for (let frame of mem) {
      if (frame === p) {
        hit = true;
        break;
      }
    }

    const fault = !hit;
    if (fault) {
      let emptyIdx = mem.indexOf(-1);
      if (emptyIdx !== -1) {
        mem[emptyIdx] = p;
      } else {
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
        mem[replaceIdx] = p;
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

export const simulateLRU = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const lastUsed = Array(numFrames).fill(-1);
  const result = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    let hitIdx = mem.indexOf(p);
    const hit = hitIdx !== -1;
    const fault = !hit;

    if (hit) {
      lastUsed[hitIdx] = i;
    } else {
      let emptyIdx = mem.indexOf(-1);
      if (emptyIdx !== -1) {
        mem[emptyIdx] = p;
        lastUsed[emptyIdx] = i;
      } else {
        let lruIdx = 0;
        let minUsed = lastUsed[0];
        for (let j = 1; j < numFrames; j++) {
          if (lastUsed[j] < minUsed) {
            minUsed = lastUsed[j];
            lruIdx = j;
          }
        }
        mem[lruIdx] = p;
        lastUsed[lruIdx] = i;
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

export const simulateLFU = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const freq = Array(numFrames).fill(0);
  const insertTime = Array(numFrames).fill(-1);
  const result = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    let hitIdx = mem.indexOf(p);
    const hit = hitIdx !== -1;
    const fault = !hit;

    if (hit) {
      freq[hitIdx]++;
    } else {
      let emptyIdx = mem.indexOf(-1);
      if (emptyIdx !== -1) {
        mem[emptyIdx] = p;
        freq[emptyIdx] = 1;
        insertTime[emptyIdx] = i;
      } else {
        let lfuIdx = 0;
        for (let j = 1; j < numFrames; j++) {
          if (freq[j] < freq[lfuIdx]) {
            lfuIdx = j;
          } else if (freq[j] === freq[lfuIdx]) {
            // Tie break with FIFO (earliest insert time)
            if (insertTime[j] < insertTime[lfuIdx]) {
              lfuIdx = j;
            }
          }
        }
        mem[lfuIdx] = p;
        freq[lfuIdx] = 1;
        insertTime[lfuIdx] = i;
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

export const simulateMFU = (numFrames, pages) => {
  const mem = Array(numFrames).fill(-1);
  const freq = Array(numFrames).fill(0);
  const insertTime = Array(numFrames).fill(-1);
  const result = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    let hitIdx = mem.indexOf(p);
    const hit = hitIdx !== -1;
    const fault = !hit;

    if (hit) {
      freq[hitIdx]++;
    } else {
      let emptyIdx = mem.indexOf(-1);
      if (emptyIdx !== -1) {
        mem[emptyIdx] = p;
        freq[emptyIdx] = 1;
        insertTime[emptyIdx] = i;
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
        mem[mfuIdx] = p;
        freq[mfuIdx] = 1;
        insertTime[mfuIdx] = i;
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
