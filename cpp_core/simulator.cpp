// ============================================================
// simulator.cpp — C++ REFERENCE IMPLEMENTATIONS
// ============================================================
// This file is a C++ mirror of src/utils/simulator.js.
// It implements core page replacement algorithms utilizing
// EFFICIENT DATA STRUCTURES:
//
//   - std::unordered_map (Hash Map): O(1) page presence lookup
//   - std::list (Doubly Linked List): O(1) LRU eviction and MRU promotion
//   - Circular Queues / Buffers: O(1) FIFO tracking
//
// Written to be compiled to WebAssembly (WASM) via Emscripten.
// ============================================================

#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <list>

using namespace emscripten;


// ────────────────────────────────────────────────────────────
// parsePages — Input Parser
// ────────────────────────────────────────────────────────────
std::vector<int> parsePages(const std::string& str) {
    std::vector<int> pages;
    std::stringstream ss(str);
    std::string token;

    while (std::getline(ss, token, ',')) {
        token.erase(remove_if(token.begin(), token.end(), ::isspace), token.end());
        if (!token.empty()) {
            pages.push_back(std::stoi(token));
        }
    }
    return pages;
}


// ────────────────────────────────────────────────────────────
// buildJson — Step Result Serializer
// ────────────────────────────────────────────────────────────
std::string buildJson(int page, const std::vector<int>& mem, bool isFault) {
    std::string res = "{";
    res += "\"page\":"  + std::to_string(page) + ",";
    res += "\"fault\":" + std::string(isFault ? "true" : "false") + ",";
    res += "\"frames\":[";
    for (size_t i = 0; i < mem.size(); ++i) {
        res += std::to_string(mem[i]);
        if (i < mem.size() - 1) res += ",";
    }
    res += "]}";
    return res;
}


// ────────────────────────────────────────────────────────────
// simulateFIFO — First In, First Out
// ────────────────────────────────────────────────────────────
// Data Structures:
//   - std::unordered_map<int, int>: O(1) page-to-frame lookup
//   - Circular pointer: O(1) FIFO replacement
// ────────────────────────────────────────────────────────────
std::string simulateFIFO(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::unordered_map<int, int> pageToFrame; // Hash map: page -> frame index
    std::string result = "[";
    int replaceIndex = 0;

    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        bool hit = (pageToFrame.find(p) != pageToFrame.end());
        bool fault = !hit;

        if (fault) {
            int oldPage = mem[replaceIndex];
            if (oldPage != -1) {
                pageToFrame.erase(oldPage);
            }

            mem[replaceIndex] = p;
            pageToFrame[p] = replaceIndex;

            replaceIndex = (replaceIndex + 1) % num_frames;
        }

        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}


// ────────────────────────────────────────────────────────────
// simulateOptimal — Optimal Page Replacement (OPR)
// ────────────────────────────────────────────────────────────
// Data Structures:
//   - std::unordered_map<int, int>: O(1) page presence lookup
// ────────────────────────────────────────────────────────────
std::string simulateOptimal(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::unordered_map<int, int> pageToFrame;
    std::string result = "[";

    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        bool hit = (pageToFrame.find(p) != pageToFrame.end());
        bool fault = !hit;

        if (fault) {
            int emptyIdx = -1;
            for (int j = 0; j < num_frames; j++) {
                if (mem[j] == -1) { emptyIdx = j; break; }
            }

            if (emptyIdx != -1) {
                mem[emptyIdx] = p;
                pageToFrame[p] = emptyIdx;
            } else {
                int replaceIdx = -1;
                int farthest = -1;

                for (int j = 0; j < num_frames; j++) {
                    int nextUse = 1e9;
                    for (size_t k = i + 1; k < pages.size(); k++) {
                        if (pages[k] == mem[j]) {
                            nextUse = k;
                            break;
                        }
                    }

                    if (nextUse > farthest) {
                        farthest = nextUse;
                        replaceIdx = j;
                    }
                }

                int victimPage = mem[replaceIdx];
                pageToFrame.erase(victimPage);

                mem[replaceIdx] = p;
                pageToFrame[p] = replaceIdx;
            }
        }
        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}


// ────────────────────────────────────────────────────────────
// simulateLRU — Least Recently Used (Hash Map + Doubly Linked List)
// ────────────────────────────────────────────────────────────
// Data Structures:
//   1. std::list<std::pair<int, int>>: Doubly Linked List storing (page, frameIdx)
//      - Front = Most Recently Used (MRU)
//      - Back  = Least Recently Used (LRU)
//   2. std::unordered_map<int, std::list<std::pair<int, int>>::iterator>:
//      - Hash Map providing O(1) direct iterator access to list nodes
// ────────────────────────────────────────────────────────────
std::string simulateLRU(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    
    // Doubly Linked List storing (page, frameIdx)
    std::list<std::pair<int, int>> dll; 
    // Hash Map: page -> list iterator
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> pageMap;

    std::string result = "[";
    int nextFreeFrame = 0;

    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        auto it = pageMap.find(p);
        bool hit = (it != pageMap.end());
        bool fault = !hit;

        if (hit) {
            // O(1) Hit: Move existing node to front (MRU) using splice
            dll.splice(dll.begin(), dll, it->second);
        } else {
            // Fault
            if ((int)dll.size() < num_frames) {
                // Free frame available
                int frameIdx = nextFreeFrame++;
                mem[frameIdx] = p;
                dll.push_front({p, frameIdx});
                pageMap[p] = dll.begin();
            } else {
                // Cache full: Evict LRU from back in O(1)
                auto lruEntry = dll.back();
                int victimPage = lruEntry.first;
                int frameIdx = lruEntry.second;

                pageMap.erase(victimPage);
                dll.pop_back();

                // Insert new page at MRU front in O(1)
                mem[frameIdx] = p;
                dll.push_front({p, frameIdx});
                pageMap[p] = dll.begin();
            }
        }

        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}


// ────────────────────────────────────────────────────────────
// simulateLFU — Least Frequently Used
// ────────────────────────────────────────────────────────────
// Data Structures:
//   - std::unordered_map<int, int>: O(1) page presence lookup
//   - std::vector for frequency and insertion time tracking
// ────────────────────────────────────────────────────────────
std::string simulateLFU(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::vector<int> freq(num_frames, 0);
    std::vector<int> insertTime(num_frames, -1);
    std::unordered_map<int, int> pageToFrame;
    std::string result = "[";

    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        auto it = pageToFrame.find(p);
        bool hit = (it != pageToFrame.end());
        bool fault = !hit;

        if (hit) {
            int hitIdx = it->second;
            freq[hitIdx]++;
        } else {
            int emptyIdx = -1;
            for (int j = 0; j < num_frames; j++) {
                if (mem[j] == -1) { emptyIdx = j; break; }
            }

            if (emptyIdx != -1) {
                mem[emptyIdx] = p;
                freq[emptyIdx] = 1;
                insertTime[emptyIdx] = i;
                pageToFrame[p] = emptyIdx;
            } else {
                int lfuIdx = 0;
                for (int j = 1; j < num_frames; j++) {
                    if (freq[j] < freq[lfuIdx]) {
                        lfuIdx = j;
                    } else if (freq[j] == freq[lfuIdx]) {
                        if (insertTime[j] < insertTime[lfuIdx]) {
                            lfuIdx = j;
                        }
                    }
                }

                int victimPage = mem[lfuIdx];
                pageToFrame.erase(victimPage);

                mem[lfuIdx] = p;
                freq[lfuIdx] = 1;
                insertTime[lfuIdx] = i;
                pageToFrame[p] = lfuIdx;
            }
        }
        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}


// ────────────────────────────────────────────────────────────
// simulateMFU — Most Frequently Used
// ────────────────────────────────────────────────────────────
// Data Structures:
//   - std::unordered_map<int, int>: O(1) page presence lookup
//   - std::vector for frequency and insertion time tracking
// ────────────────────────────────────────────────────────────
std::string simulateMFU(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::vector<int> freq(num_frames, 0);
    std::vector<int> insertTime(num_frames, -1);
    std::unordered_map<int, int> pageToFrame;
    std::string result = "[";

    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        auto it = pageToFrame.find(p);
        bool hit = (it != pageToFrame.end());
        bool fault = !hit;

        if (hit) {
            int hitIdx = it->second;
            freq[hitIdx]++;
        } else {
            int emptyIdx = -1;
            for (int j = 0; j < num_frames; j++) {
                if (mem[j] == -1) { emptyIdx = j; break; }
            }

            if (emptyIdx != -1) {
                mem[emptyIdx] = p;
                freq[emptyIdx] = 1;
                insertTime[emptyIdx] = i;
                pageToFrame[p] = emptyIdx;
            } else {
                int mfuIdx = 0;
                for (int j = 1; j < num_frames; j++) {
                    if (freq[j] > freq[mfuIdx]) {
                        mfuIdx = j;
                    } else if (freq[j] == freq[mfuIdx]) {
                        if (insertTime[j] < insertTime[mfuIdx]) {
                            mfuIdx = j;
                        }
                    }
                }

                int victimPage = mem[mfuIdx];
                pageToFrame.erase(victimPage);

                mem[mfuIdx] = p;
                freq[mfuIdx] = 1;
                insertTime[mfuIdx] = i;
                pageToFrame[p] = mfuIdx;
            }
        }
        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}


// ────────────────────────────────────────────────────────────
// EMSCRIPTEN_BINDINGS — C++ to JavaScript Function Exports
// ────────────────────────────────────────────────────────────
EMSCRIPTEN_BINDINGS(simulator_module) {
    function("simulateFIFO",    &simulateFIFO);
    function("simulateOptimal", &simulateOptimal);
    function("simulateLRU",     &simulateLRU);
    function("simulateLFU",     &simulateLFU);
    function("simulateMFU",     &simulateMFU);
}
