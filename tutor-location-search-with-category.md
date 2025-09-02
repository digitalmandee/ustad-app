# Tutor Location Search with Category Filter

## Overview
The `findTutorsByLocation` function in the ustaad-tutor service has been enhanced to include a category filter based on tutor subjects.

## API Endpoint
`GET /api/v1/tutor/locations/search`

## Parameters

### Required Parameters
- `latitude` (number): Parent's latitude (-90 to 90)
- `longitude` (number): Parent's longitude (-180 to 180) 
- `radius` (number): Search radius in kilometers (0.1 to 100)

### Optional Parameters
- `limit` (number): Maximum number of results (1 to 100, default: 20)
- `offset` (number): Number of results to skip (default: 0)
- `category` (string): Subject filter (e.g., "math", "science", "english")

## Usage Examples

### Basic Location Search
```bash
GET /api/v1/tutor/locations/search?latitude=33.6844&longitude=73.0479&radius=5
```

### Location Search with Category Filter
```bash
# Find math tutors within 5km
GET /api/v1/tutor/locations/search?latitude=33.6844&longitude=73.0479&radius=5&category=math

# Find science tutors within 10km with pagination
GET /api/v1/tutor/locations/search?latitude=33.6844&longitude=73.0479&radius=10&category=science&limit=10&offset=0
```

## Response Format

```json
{
  "success": true,
  "message": "Nearby Tutors retrieved successfully",
  "data": [
    {
      "id": "location-uuid-1",
      "tutorId": "tutor-uuid-1",
      "latitude": 33.6844,
      "longitude": 73.0479,
      "address": "Sample Address",
      "geoHash": "abc123",
      "distance": 2.5,
      "tutor": {
        "id": "tutor-uuid-1",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "image": "profile.jpg",
        "Tutor": {
          "subjects": ["math", "physics"],
          "about": "Experienced math tutor",
          "grade": "Masters"
        }
      }
    }
  ]
}
```

## How Category Filtering Works

1. **Case Insensitive**: Category search is case insensitive (automatically converted to lowercase)
2. **Partial Match**: Uses PostgreSQL's `@>` operator to check if the subjects array contains the category
3. **Subject Storage**: Tutor subjects are stored as an array of strings in the database
4. **Combined Filtering**: Location and category filters work together - tutors must match both location and subject criteria

## Subject Examples
Common subject categories that can be used:
- `math` / `mathematics`
- `science` / `physics` / `chemistry` / `biology`
- `english` / `literature`
- `history` / `geography`
- `computer` / `programming`
- `art` / `music`

## Implementation Details

### Database Schema
```sql
-- Tutors table has subjects as array
subjects: TEXT[] -- e.g., ['math', 'physics', 'chemistry']
```

### Query Logic
1. When no location parameters provided: Returns all tutors (with optional category filter)
2. When location parameters provided: 
   - Uses geohash for initial filtering
   - Calculates actual distance for precise results
   - Applies category filter if provided
   - Sorts by distance (closest first)

### Validation Rules
- `category`: Optional string, 1-50 characters, trimmed and converted to lowercase

## Error Handling
- Invalid coordinates return validation error
- Invalid radius returns validation error  
- Invalid category length returns validation error
- Database errors are properly caught and handled

## Performance Considerations
- Geohash indexing for fast location queries
- Category filtering happens at database level
- Results are limited and paginated to prevent large response payloads
- Distance calculation only performed on geohash-filtered results
