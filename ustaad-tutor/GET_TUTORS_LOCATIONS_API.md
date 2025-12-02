# GET_TUTORS_LOCATIONS API Documentation

Complete documentation for the tutor location search API endpoint.

---

## Endpoint

```
GET /api/v1/tutor/locations
```

**Base URL:** `http://localhost:301/api/v1` (or your server URL)

---

## Authentication

**Required:** Yes (JWT Token)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Authorized Roles:** `TUTOR`, `PARENT`

---

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `latitude` | number | ❌ No* | - | Parent/search location latitude (-90 to 90) |
| `longitude` | number | ❌ No* | - | Parent/search location longitude (-180 to 180) |
| `radius` | number | ❌ No* | - | Search radius in kilometers (0.1 to 100) |
| `limit` | number | ❌ No | 20 | Maximum number of results to return (1-100) |
| `offset` | number | ❌ No | 0 | Number of results to skip (for pagination) |
| `category` | string | ❌ No | - | Subject filter (e.g., "math", "science", "english") |

**Note:** *If `latitude`, `longitude`, and `radius` are not provided, the API returns all tutors (with optional category filter).

---

## Request Examples

### Example 1: Search Tutors by Location

```http
GET /api/v1/tutor/locations?latitude=24.8607&longitude=67.0011&radius=5&limit=10&offset=0
Authorization: Bearer <token>
```

**Description:** Find tutors within 5km of Karachi coordinates (24.8607, 67.0011)

### Example 2: Search Tutors by Location with Category Filter

```http
GET /api/v1/tutor/locations?latitude=24.8607&longitude=67.0011&radius=10&category=math&limit=20
Authorization: Bearer <token>
```

**Description:** Find math tutors within 10km of the specified location

### Example 3: Get All Tutors (No Location Filter)

```http
GET /api/v1/tutor/locations?limit=50&offset=0
Authorization: Bearer <token>
```

**Description:** Get all tutors (no location filtering)

### Example 4: Get All Tutors by Category

```http
GET /api/v1/tutor/locations?category=science&limit=30
Authorization: Bearer <token>
```

**Description:** Get all science tutors

---

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Nearby Tutors retrieved successfully",
  "data": [
    {
      "id": "location-uuid",
      "tutorId": "tutor-user-uuid",
      "latitude": 24.8610,
      "longitude": 67.0015,
      "address": "Karachi, Pakistan",
      "geoHash": "tkk3xyz",
      "distance": 0.5,
      "createdAt": "2025-01-01T12:00:00.000Z",
      "updatedAt": "2025-01-01T12:00:00.000Z",
      "tutor": {
        "id": "tutor-user-uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "03001234567",
        "image": "https://...",
        "totalExperience": 5.5,
        "Tutor": {
          "subjects": ["math", "science", "physics"],
          "about": "Experienced tutor with 5+ years",
          "grade": "A-Level"
        },
        "TutorExperiences": [
          {
            "startDate": "2020-01-01",
            "endDate": "2023-12-31"
          }
        ]
      }
    },
    {
      "id": "location-uuid-2",
      "tutorId": "tutor-user-uuid-2",
      "latitude": 24.8620,
      "longitude": 67.0020,
      "address": "Karachi, Pakistan",
      "geoHash": "tkk3xyy",
      "distance": 1.2,
      "createdAt": "2025-01-01T12:00:00.000Z",
      "updatedAt": "2025-01-01T12:00:00.000Z",
      "tutor": {
        "id": "tutor-user-uuid-2",
        "fullName": "Jane Smith",
        "email": "jane@example.com",
        "phone": "03009876543",
        "image": "https://...",
        "totalExperience": 3.2,
        "Tutor": {
          "subjects": ["english", "literature"],
          "about": "English language expert",
          "grade": "O-Level"
        },
        "TutorExperiences": [
          {
            "startDate": "2021-06-01",
            "endDate": "2024-12-31"
          }
        ]
      }
    }
  ]
}
```

### Response Fields

#### Location Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Location record ID |
| `tutorId` | string (UUID) | Tutor user ID |
| `latitude` | number | Location latitude |
| `longitude` | number | Location longitude |
| `address` | string | Location address |
| `geoHash` | string | Geohash for location indexing |
| `distance` | number | Distance in km from search location (only if location params provided) |
| `createdAt` | string (ISO date) | Location creation timestamp |
| `updatedAt` | string (ISO date) | Location update timestamp |

#### Tutor Object (nested)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | User ID |
| `fullName` | string | Tutor's full name |
| `email` | string | Tutor's email |
| `phone` | string | Tutor's phone number |
| `image` | string | Profile image URL |
| `totalExperience` | number | Total years of experience (calculated) |
| `Tutor` | object | Tutor profile details |
| `Tutor.subjects` | string[] | Array of subjects taught |
| `Tutor.about` | string | Tutor bio/description |
| `Tutor.grade` | string | Grade level (e.g., "A-Level", "O-Level") |
| `TutorExperiences` | array | Array of experience records |

### Error Response (400)

```json
{
  "success": false,
  "message": "latitude must be a valid float between -90 and 90"
}
```

### Error Response (401)

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Error Response (500)

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## How It Works

### 1. Location-Based Search (when latitude, longitude, radius provided)

1. **Geohash Generation:**
   - Generates geohash for the search location
   - Calculates geohash precision based on radius:
     - `radius <= 1km`: precision 6
     - `radius <= 5km`: precision 5
     - `radius > 5km`: precision 4

2. **Initial Filtering:**
   - Finds tutor locations with matching geohash prefix
   - This provides a fast initial filter using indexed geohash

3. **Distance Calculation:**
   - Calculates actual distance using Haversine formula
   - Filters tutors within the specified radius
   - Sorts by distance (nearest first)

4. **Deduplication:**
   - Removes duplicate tutors (if a tutor has multiple locations)
   - Keeps the closest location for each tutor

5. **Category Filtering (if provided):**
   - Filters tutors by subject category
   - Case-insensitive matching

6. **Experience Calculation:**
   - Calculates total years of experience from TutorExperience records
   - Rounds to 1 decimal place

7. **Pagination:**
   - Applies limit and offset
   - If category filter is used, gets more results first, then paginates

### 2. All Tutors Search (when location params not provided)

1. **No Location Filter:**
   - Returns all tutor locations
   - Optionally filters by category

2. **Deduplication:**
   - Removes duplicate tutors (keeps one location per tutor)

3. **Experience Calculation:**
   - Calculates total experience for each tutor

4. **Pagination:**
   - Applies limit and offset

---

## Algorithm Details

### Geohash Precision

The geohash precision is calculated based on radius:
- **Precision 6:** ~0.6km accuracy (for radius ≤ 1km)
- **Precision 5:** ~2.4km accuracy (for radius ≤ 5km)
- **Precision 4:** ~20km accuracy (for radius > 5km)

### Distance Calculation (Haversine Formula)

```javascript
distance = 2 * R * atan2(√a, √(1-a))

where:
a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
R = 6371 km (Earth's radius)
```

### Experience Calculation

```javascript
totalExperience = Σ (endDate - startDate) for all experiences
Rounded to 1 decimal place
```

---

## Database Models Used

### TutorLocation
- Stores tutor location coordinates
- Has indexed `geoHash` field for fast location queries
- Linked to User via `tutorId`

### User
- Contains tutor user information
- Linked to Tutor profile

### Tutor
- Contains tutor profile (subjects, about, grade)
- Used for category filtering

### TutorExperience
- Contains tutor work experience
- Used to calculate total experience

---

## Performance Considerations

1. **Geohash Indexing:**
   - `geoHash` field is indexed for fast location queries
   - Reduces database scan time

2. **Query Optimization:**
   - Uses geohash prefix matching for initial filter
   - Then calculates exact distance for final filtering

3. **Pagination:**
   - Limits results to prevent large data transfers
   - Default limit: 20, max: 100

4. **Deduplication:**
   - Removes duplicate tutors efficiently
   - Keeps closest location when multiple locations exist

---

## Use Cases

1. **Parent Searching for Tutors:**
   - Search tutors near their location
   - Filter by subject category
   - See tutor profiles and experience

2. **Tutor Discovery:**
   - Find tutors in a specific area
   - Filter by subject expertise
   - View tutor qualifications

3. **Location-Based Matching:**
   - Match parents with nearby tutors
   - Optimize for in-person tutoring sessions

---

## Example Usage (JavaScript)

```javascript
// Search for math tutors within 5km
const searchTutors = async (lat, lng, radius = 5) => {
  const response = await fetch(
    `/api/v1/tutor/locations?latitude=${lat}&longitude=${lng}&radius=${radius}&category=math&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    data.data.forEach(tutor => {
      console.log(`${tutor.tutor.fullName} - ${tutor.distance}km away`);
      console.log(`Subjects: ${tutor.tutor.Tutor.subjects.join(', ')}`);
      console.log(`Experience: ${tutor.tutor.totalExperience} years`);
    });
  }
};

// Get all tutors
const getAllTutors = async () => {
  const response = await fetch(
    `/api/v1/tutor/locations?limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
};
```

---

## Notes

1. **Category Filter:**
   - Case-insensitive matching
   - Matches if tutor's subjects array contains the category
   - Example: category "math" matches tutors with subjects ["Math", "MATH", "math"]

2. **Distance Field:**
   - Only included in response when location params are provided
   - Measured in kilometers
   - Sorted by distance (nearest first)

3. **Multiple Locations:**
   - If a tutor has multiple locations, only one is returned
   - For location-based search: closest location is kept
   - For all tutors search: first location is kept

4. **Experience Calculation:**
   - Only counts completed experiences (has endDate)
   - Sums all experience periods
   - Returns 0 if no experience records

5. **Pagination:**
   - When category filter is used, gets up to 1000 results first
   - Then applies pagination to deduplicated results
   - This ensures category filtering works correctly with pagination

---

**Last Updated:** 2025-01-01

