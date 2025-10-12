package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

type cacheItem struct {
	data     []byte
	expireAt time.Time
}

var cache = struct {
	sync.RWMutex
	items map[string]cacheItem
}{items: make(map[string]cacheItem)}

var (
	googleAPIHarmonogram = "https://script.google.com/macros/s/AKfycbytnF2N3PpvF4Iny8iwpFc-F532n6PqEQ6WezERjIbKiLIvAzCrFDlHMjRGviJNUCzcFA/exec?getHarmonogram"
	googleAPIPrednasky   = "https://script.google.com/macros/s/AKfycbytnF2N3PpvF4Iny8iwpFc-F532n6PqEQ6WezERjIbKiLIvAzCrFDlHMjRGviJNUCzcFA/exec?getLectures"
	cacheTTL             = 15 * time.Minute
)

func main() {
	http.HandleFunc("/API/", handleAPI)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Cache proxy running.")
	})
	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleAPI(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	endpoint := strings.TrimPrefix(r.URL.Path, "/API/")

	if strings.HasPrefix(endpoint, "harmonogram") {
		serveHarmonogram(w, r)
		return
	}

	if strings.HasPrefix(endpoint, "prednaska") {
		serveLecture(w, r, endpoint)
		return
	}

	http.NotFound(w, r)
}

func serveLecture(w http.ResponseWriter, r *http.Request, endpoint string) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	parts := strings.Split(endpoint, "/")
	var lectureID string
	if len(parts) > 1 {
		lectureID = parts[1]
	}

	cache.RLock()
	item, found := cache.items["prednasky"]
	cache.RUnlock()

	var data []byte
	var err error
	if found && time.Now().Before(item.expireAt) {
		w.Header().Set("X-Cache", "HIT")
		data = item.data
	} else {
		w.Header().Set("X-Cache", "MISS")
		data, err = fetchAndCache("prednasky", googleAPIPrednasky)
		if err != nil {
			http.Error(w, "Upstream request failed: "+err.Error(), 502)
			return
		}
	}

	if lectureID == "" {
		w.Write(data)
		return
	}

	var lectures map[string]any
	if err := json.Unmarshal(data, &lectures); err != nil {
		http.Error(w, "Invalid JSON from upstream", 500)
		return
	}

	if lecture, ok := lectures[lectureID]; ok {
		resp, _ := json.Marshal(lecture)
		w.Write(resp)
	} else {
		http.Error(w, fmt.Sprintf("Lecture ID %s not found", lectureID), 404)
	}
}

func serveHarmonogram(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	cache.RLock()
	item, found := cache.items["harmonogram"]
	cache.RUnlock()

	var data []byte
	var err error
	if found && time.Now().Before(item.expireAt) {
		w.Header().Set("X-Cache", "HIT")
		data = item.data
	} else {
		w.Header().Set("X-Cache", "MISS")
		data, err = fetchAndCache("harmonogram", googleAPIHarmonogram)
		if err != nil {
			http.Error(w, "Upstream request failed: "+err.Error(), 502)
			return
		}
	}

	w.Write(data)
}

func fetchAndCache(key, url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	cache.Lock()
	cache.items[key] = cacheItem{data: body, expireAt: time.Now().Add(cacheTTL)}
	cache.Unlock()

	return body, nil
}

func enableCORS(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    if r.Method == http.MethodOptions {
        w.WriteHeader(http.StatusOK)
        return
    }
}