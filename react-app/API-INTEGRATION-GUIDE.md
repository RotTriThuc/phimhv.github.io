# 🎬 API Integration Guide

## 📚 API Documentation

**Official API Docs:** [https://kkphim.com/tai-lieu-api](https://kkphim.com/tai-lieu-api)

**Base URL:** `https://phimapi.com`

---

## ✅ Đã Integrate

### **1. Movie API Service** (`src/services/movieApi.ts`)

Centralized service với đầy đủ features theo [official documentation](https://kkphim.com/tai-lieu-api):

```typescript
import { movieApi } from '../services/movieApi';
```

---

## 🎯 Available Methods

### **1. Danh Sách Phim Mới**

```typescript
// Lấy phim mới cập nhật
const response = await movieApi.getNewMovies(page);
```

**Parameters:**
- `page` (number): Số trang (default: 1)

**Returns:** `ApiResponse<Movie>`

---

### **2. Danh Sách Theo Loại**

```typescript
// Lấy phim theo type
const response = await movieApi.getMoviesByType('hoat-hinh', {
  page: 1,
  limit: 24,
  sort_field: 'modified.time',
  sort_type: 'desc',
});
```

**Types Available:**
- `phim-bo` - Phim bộ
- `phim-le` - Phim lẻ
- `tv-shows` - TV Shows
- `hoat-hinh` - Hoạt hình/Anime
- `phim-vietsub` - Phim Vietsub
- `phim-thuyet-minh` - Phim Thuyết Minh
- `phim-long-tieng` - Phim Lồng Tiếng

**Parameters:**
```typescript
interface SearchParams {
  page?: number;              // Số trang (default: 1)
  limit?: number;             // Giới hạn kết quả (max: 64)
  sort_field?: 'modified.time' | '_id' | 'year';
  sort_type?: 'desc' | 'asc';
  sort_lang?: 'vietsub' | 'thuyet-minh' | 'long-tieng';
  category?: string;          // Slug thể loại
  country?: string;           // Slug quốc gia
  year?: number;              // Năm (1970 - hiện tại)
}
```

---

### **3. Tìm Kiếm Phim**

```typescript
const response = await movieApi.searchMovies({
  keyword: 'One Piece',
  page: 1,
  limit: 24,
  sort_field: 'modified.time',
  sort_type: 'desc',
});
```

**Parameters:** Same as `SearchParams` + `keyword`

---

### **4. Chi Tiết Phim**

```typescript
const response = await movieApi.getMovieDetail('one-piece');
```

**Parameters:**
- `slug` (string): Movie slug

**Returns:** `{ status, msg, movie: MovieDetail }`

**MovieDetail includes:**
- All movie info
- `episodes[]` - Danh sách tập phim với link

---

### **5. Phim Theo Thể Loại**

```typescript
const response = await movieApi.getMoviesByCategory('hanh-dong', {
  page: 1,
  limit: 24,
});
```

**Parameters:**
- `categorySlug` (string): Slug thể loại
- `params` (SearchParams): Optional filters

---

### **6. Phim Theo Quốc Gia**

```typescript
const response = await movieApi.getMoviesByCountry('nhat-ban', {
  page: 1,
});
```

**Parameters:**
- `countrySlug` (string): Slug quốc gia
- `params` (SearchParams): Optional filters

---

### **7. Phim Theo Năm**

```typescript
const response = await movieApi.getMoviesByYear(2024, {
  page: 1,
});
```

**Parameters:**
- `year` (number): Năm (1970 - hiện tại)
- `params` (SearchParams): Optional filters

---

### **8. Image Optimization (WebP)** ✨

```typescript
// Optimize image to WebP format
const optimizedUrl = movieApi.optimizeImage(movie.poster_url);
```

**Benefits:**
- ✅ Faster load times
- ✅ Smaller file sizes
- ✅ Better SEO
- ✅ Automatic conversion

**Example:**
```typescript
// Before
poster_url: "https://phimimg.com/upload/vod/20240101/abc.jpg"

// After optimization
optimizedUrl: "https://phimapi.com/image.php?url=https://phimimg.com/upload/vod/20240101/abc.jpg"
// Returns: WebP format (smaller & faster)
```

---

## 📊 Response Format

### **ApiResponse<T> Structure:**

```typescript
{
  status: boolean,
  msg: string,
  data: {
    items: Movie[],
    params: {
      pagination: {
        totalItems: number,
        totalItemsPerPage: number,
        currentPage: number,
        totalPages: number
      }
    },
    seoOnPage: { ... },
    breadCrumb: [ ... ]
  }
}
```

### **Movie Object:**

```typescript
{
  _id: string,
  name: string,                    // Tên phim
  slug: string,                    // Slug URL
  origin_name: string,             // Tên gốc
  poster_url: string,              // URL poster
  thumb_url: string,               // URL thumbnail
  year: number,                    // Năm phát hành
  quality: string,                 // HD, Full HD, etc.
  lang: string,                    // Vietsub, Thuyết minh, etc.
  episode_current: string,         // Tập hiện tại
  episode_total: string,           // Tổng số tập
  category: [                      // Thể loại
    { id, name, slug }
  ],
  country: [                       // Quốc gia
    { id, name, slug }
  ],
  // ... more fields
}
```

---

## 🎯 Usage Examples

### **Example 1: Homepage - Load Anime**

```typescript
import { movieApi } from '../services/movieApi';

const HomePage = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      const response = await movieApi.getMoviesByType('hoat-hinh', {
        page: 1,
        limit: 24,
        sort_field: 'modified.time',
        sort_type: 'desc',
      });

      // Optimize images to WebP
      const optimizedMovies = response.data.items.map(movie => ({
        ...movie,
        poster_url: movieApi.optimizeImage(movie.poster_url),
      }));

      setMovies(optimizedMovies);
    };

    fetchMovies();
  }, []);

  return (
    <div>
      {movies.map(movie => (
        <MovieCard key={movie.slug} movie={movie} />
      ))}
    </div>
  );
};
```

---

### **Example 2: Search Page**

```typescript
const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const response = await movieApi.searchMovies({
      keyword: query,
      page: 1,
      limit: 20,
    });

    setResults(response.data.items);
  };

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      
      {results.map(movie => (
        <MovieCard key={movie.slug} movie={movie} />
      ))}
    </div>
  );
};
```

---

### **Example 3: Movie Detail Page**

```typescript
const MovieDetailPage = () => {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      const response = await movieApi.getMovieDetail(slug);
      setMovie(response.movie);
    };

    fetchDetail();
  }, [slug]);

  if (!movie) return <Loading />;

  return (
    <div>
      <h1>{movie.name}</h1>
      <img src={movieApi.optimizeImage(movie.poster_url)} />
      
      <h2>Episodes:</h2>
      {movie.episodes.map(server => (
        <div key={server.server_name}>
          <h3>{server.server_name}</h3>
          {server.server_data.map(episode => (
            <button key={episode.slug}>
              {episode.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};
```

---

### **Example 4: Filter by Category & Country**

```typescript
const FilteredMovies = () => {
  const [movies, setMovies] = useState([]);

  const fetchFiltered = async () => {
    const response = await movieApi.getMoviesByType('hoat-hinh', {
      category: 'hanh-dong',     // Action category
      country: 'nhat-ban',       // Japan
      year: 2024,
      sort_field: 'year',
      sort_type: 'desc',
      limit: 30,
    });

    setMovies(response.data.items);
  };

  return (
    <div>
      <button onClick={fetchFiltered}>
        Anime Hành Động Nhật 2024
      </button>
      {/* Display movies */}
    </div>
  );
};
```

---

## 🔥 Advanced Features

### **1. Pagination**

```typescript
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const fetchPage = async (pageNum: number) => {
  const response = await movieApi.getMoviesByType('hoat-hinh', {
    page: pageNum,
    limit: 24,
  });

  setMovies(response.data.items);
  setTotalPages(response.data.params.pagination.totalPages);
};

// Next page
<button onClick={() => fetchPage(page + 1)}>Next</button>
```

---

### **2. Sorting Options**

```typescript
const [sortField, setSortField] = useState('modified.time');
const [sortType, setSortType] = useState('desc');

const fetchSorted = async () => {
  const response = await movieApi.getMoviesByType('hoat-hinh', {
    sort_field: sortField,
    sort_type: sortType,
  });

  setMovies(response.data.items);
};

<select onChange={(e) => setSortField(e.target.value)}>
  <option value="modified.time">Mới cập nhật</option>
  <option value="year">Năm phát hành</option>
  <option value="_id">ID</option>
</select>
```

---

### **3. Language Filter**

```typescript
const fetchByLanguage = async (lang: string) => {
  const response = await movieApi.getMoviesByType('hoat-hinh', {
    sort_lang: lang,  // 'vietsub' | 'thuyet-minh' | 'long-tieng'
  });

  setMovies(response.data.items);
};

<button onClick={() => fetchByLanguage('vietsub')}>
  Vietsub
</button>
```

---

## ⚡ Performance Tips

### **1. Use Image Optimization**

```typescript
// ✅ GOOD - Optimized WebP
const poster = movieApi.optimizeImage(movie.poster_url);

// ❌ BAD - Original JPG
const poster = movie.poster_url;
```

### **2. Limit Results**

```typescript
// ✅ GOOD - Reasonable limit
{ limit: 24 }  // Fast load

// ❌ BAD - Too many
{ limit: 100 } // Slow load
```

### **3. Cache Results**

```typescript
const [cache, setCache] = useState(new Map());

const fetchWithCache = async (key, fetcher) => {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const data = await fetcher();
  setCache(prev => new Map(prev).set(key, data));
  return data;
};
```

---

## 🐛 Error Handling

```typescript
try {
  const response = await movieApi.searchMovies({ keyword: query });
  
  if (!response.status) {
    throw new Error(response.msg || 'API error');
  }

  setMovies(response.data.items);
} catch (error) {
  console.error('API Error:', error);
  setError('Không thể tải dữ liệu');
}
```

---

## 📖 Additional Resources

- **API Documentation:** [https://kkphim.com/tai-lieu-api](https://kkphim.com/tai-lieu-api)
- **Image CDN:** `https://phimimg.com`
- **API Base:** `https://phimapi.com`

---

## ✅ Checklist

- [x] API Service implemented
- [x] Image optimization (WebP)
- [x] Full TypeScript support
- [x] Error handling
- [x] Search functionality
- [x] Filter & sort options
- [x] Pagination support
- [x] Category & country filters
- [x] Year filtering
- [ ] Caching strategy (todo)
- [ ] Rate limiting (todo)

---

**Made with ❤️ | Powered by [KKPhim API](https://kkphim.com/tai-lieu-api)**

