"""
H3 Geospatial Location Engine
Converts lat/lng to H3 hexagonal indexes for fast radius-based searches
"""
import h3


def get_h3_index(lat: float, lng: float, resolution: int = 9) -> str:
    """
    Convert latitude/longitude to H3 index
    
    Resolution 9 = ~0.1 km² cells (ideal for neighborhood-level search)
    
    Args:
        lat: Latitude (-90 to 90)
        lng: Longitude (-180 to 180)
        resolution: H3 resolution level (default: 9)
    
    Returns:
        H3 index string
    """
    return h3.latlng_to_cell(lat, lng, resolution)


def get_nearby_h3_cells(lat: float, lng: float, km: int, resolution: int = 9) -> list[str]:
    """
    Get all H3 cells within a radius (in kilometers)
    
    This is the KEY optimization: instead of scanning all rows with haversine distance,
    we do a constant-time lookup of hex cells.
    
    Args:
        lat: Center latitude
        lng: Center longitude
        km: Radius in kilometers
        resolution: H3 resolution (default: 9)
    
    Returns:
        List of H3 index strings covering the radius
    """
    center_hex = h3.latlng_to_cell(lat, lng, resolution)
    
    # Map km to k-ring size (approximate)
    # At resolution 9, each ring adds ~0.5km radius
    k_ring_map = {
        1: 1,   # ~1km radius
        2: 2,   # ~2km radius
        5: 3,   # ~5km radius
        10: 5,  # ~10km radius
        25: 10, # ~25km radius
    }
    
    # Find closest k value
    k = k_ring_map.get(km, 3)
    for threshold, ring_size in sorted(k_ring_map.items()):
        if km <= threshold:
            k = ring_size
            break
    
    # Get all hexagons within k rings
    return list(h3.grid_disk(center_hex, k))


def get_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two points using H3's built-in haversine
    
    Args:
        lat1, lng1: First point
        lat2, lng2: Second point
    
    Returns:
        Distance in kilometers
    """
    # H3 v4 uses great_circle_distance
    return h3.great_circle_distance((lat1, lng1), (lat2, lng2), unit='km')
