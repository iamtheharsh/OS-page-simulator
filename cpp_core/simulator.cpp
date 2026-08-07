#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <iostream>

using namespace emscripten;

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

std::string buildJson(int page, const std::vector<int>& mem, bool isFault) {
    std::string res = "{";
    res += "\"page\":" + std::to_string(page) + ",";
    res += "\"fault\":" + std::string(isFault ? "true" : "false") + ",";
    res += "\"frames\":[";
    for (size_t i = 0; i < mem.size(); ++i) {
        res += std::to_string(mem[i]);
        if (i < mem.size() - 1) res += ",";
    }
    res += "]}";
    return res;
}

std::string simulateFIFO(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::string result = "[";
    int replaceIndex = 0;
    
    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        bool hit = false;
        for (int frame : mem) {
            if (frame == p) { hit = true; break; }
        }
        
        bool fault = !hit;
        if (fault) {
            mem[replaceIndex] = p;
            replaceIndex = (replaceIndex + 1) % num_frames;
        }
        
        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}

std::string simulateOptimal(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::string result = "[";
    
    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        bool hit = false;
        for (int frame : mem) {
            if (frame == p) { hit = true; break; }
        }
        
        bool fault = !hit;
        if (fault) {
            int emptyIdx = -1;
            for(int j=0; j<num_frames; j++) {
                if(mem[j] == -1) { emptyIdx = j; break; }
            }
            if(emptyIdx != -1) {
                mem[emptyIdx] = p;
            } else {
                int replaceIdx = -1;
                int farthest = -1;
                for(int j=0; j<num_frames; j++) {
                    int nextUse = 1e9;
                    for(size_t k = i+1; k < pages.size(); k++) {
                        if(pages[k] == mem[j]) {
                            nextUse = k;
                            break;
                        }
                    }
                    if(nextUse > farthest) {
                        farthest = nextUse;
                        replaceIdx = j;
                    }
                }
                mem[replaceIdx] = p;
            }
        }
        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}

std::string simulateLRU(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::vector<int> lastUsed(num_frames, -1);
    std::string result = "[";
    
    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        bool hit = false;
        int hitIdx = -1;
        for (int j = 0; j < num_frames; ++j) {
            if (mem[j] == p) { hit = true; hitIdx = j; break; }
        }
        
        bool fault = !hit;
        if (hit) {
            lastUsed[hitIdx] = i;
        } else {
            int emptyIdx = -1;
            for(int j=0; j<num_frames; j++) {
                if(mem[j] == -1) { emptyIdx = j; break; }
            }
            if(emptyIdx != -1) {
                mem[emptyIdx] = p;
                lastUsed[emptyIdx] = i;
            } else {
                int lruIdx = 0;
                int minUsed = lastUsed[0];
                for(int j=1; j<num_frames; j++) {
                    if(lastUsed[j] < minUsed) {
                        minUsed = lastUsed[j];
                        lruIdx = j;
                    }
                }
                mem[lruIdx] = p;
                lastUsed[lruIdx] = i;
            }
        }
        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}

std::string simulateLFU(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::vector<int> freq(num_frames, 0);
    std::vector<int> insertTime(num_frames, -1);
    std::string result = "[";
    
    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        bool hit = false;
        int hitIdx = -1;
        for (int j = 0; j < num_frames; ++j) {
            if (mem[j] == p) { hit = true; hitIdx = j; break; }
        }
        
        bool fault = !hit;
        if (hit) {
            freq[hitIdx]++;
        } else {
            int emptyIdx = -1;
            for(int j=0; j<num_frames; j++) {
                if(mem[j] == -1) { emptyIdx = j; break; }
            }
            if(emptyIdx != -1) {
                mem[emptyIdx] = p;
                freq[emptyIdx] = 1;
                insertTime[emptyIdx] = i;
            } else {
                int lfuIdx = 0;
                for(int j=1; j<num_frames; j++) {
                    if (freq[j] < freq[lfuIdx]) {
                        lfuIdx = j;
                    } else if (freq[j] == freq[lfuIdx]) {
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
        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}

std::string simulateMFU(int num_frames, std::string pagesStr) {
    std::vector<int> pages = parsePages(pagesStr);
    std::vector<int> mem(num_frames, -1);
    std::vector<int> freq(num_frames, 0);
    std::vector<int> insertTime(num_frames, -1);
    std::string result = "[";
    
    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        bool hit = false;
        int hitIdx = -1;
        for (int j = 0; j < num_frames; ++j) {
            if (mem[j] == p) { hit = true; hitIdx = j; break; }
        }
        
        bool fault = !hit;
        if (hit) {
            freq[hitIdx]++;
        } else {
            int emptyIdx = -1;
            for(int j=0; j<num_frames; j++) {
                if(mem[j] == -1) { emptyIdx = j; break; }
            }
            if(emptyIdx != -1) {
                mem[emptyIdx] = p;
                freq[emptyIdx] = 1;
                insertTime[emptyIdx] = i;
            } else {
                int mfuIdx = 0;
                for(int j=1; j<num_frames; j++) {
                    if (freq[j] > freq[mfuIdx]) {
                        mfuIdx = j;
                    } else if (freq[j] == freq[mfuIdx]) {
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
        result += buildJson(p, mem, fault);
        if (i < pages.size() - 1) result += ",";
    }
    result += "]";
    return result;
}

EMSCRIPTEN_BINDINGS(simulator_module) {
    function("simulateFIFO", &simulateFIFO);
    function("simulateOptimal", &simulateOptimal);
    function("simulateLRU", &simulateLRU);
    function("simulateLFU", &simulateLFU);
    function("simulateMFU", &simulateMFU);
}
