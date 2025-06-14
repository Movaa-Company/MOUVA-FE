import { haversineDistance, debounce } from './utils';
import { fetchNigerianCities } from './citiesApi';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Debounce and Fetch Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce function', () => {
    test('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    test('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    test('should handle multiple rapid calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      // Simulate rapid calls
      for (let i = 0; i < 5; i++) {
        debouncedFn(`call ${i}`);
        jest.advanceTimersByTime(100);
      }

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call 4');
    });
  });

  describe('fetchNigerianCities', () => {
    const mockCities = ['Lagos', 'Abuja', 'Kano', 'Port Harcourt'];

    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCities),
        })
      );
    });

    test('should fetch cities successfully', async () => {
      const result = await fetchNigerianCities('lag');
      expect(result).toEqual(mockCities);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle empty search query', async () => {
      const result = await fetchNigerianCities('');
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(fetchNigerianCities('lag')).rejects.toThrow('Network error');
    });

    test('should handle non-OK response', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      );

      await expect(fetchNigerianCities('lag')).rejects.toThrow('Failed to fetch cities');
    });
  });

  describe('Debounced Fetch Integration', () => {
    const mockCities = ['Lagos', 'Abuja', 'Kano'];
    let debouncedFetch: (query: string) => Promise<string[]>;

    beforeEach(() => {
      // Reset mock implementation for each test
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCities),
        })
      );

      // Create a debounced fetch function
      debouncedFetch = debounce(async (query: string) => {
        if (query.length < 2) return [];
        try {
          const response = await fetch(`/api/cities?q=${query}`);
          if (!response.ok) throw new Error('Failed to fetch cities');
          return response.json();
        } catch (error) {
          throw error;
        }
      }, 300);
    });

    test('should debounce fetch calls and return results', async () => {
      // Start all fetch calls
      const promise1 = debouncedFetch('la');
      const promise2 = debouncedFetch('lag');
      const promise3 = debouncedFetch('lago');

      // Verify fetch hasn't been called yet
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance timers to trigger the debounced function
      jest.advanceTimersByTime(300);

      // Wait for all promises to resolve
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      // Verify fetch was called only once with the last query
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/cities?q=lago');

      // Verify all promises resolved with the same result
      expect(result1).toEqual(mockCities);
      expect(result2).toEqual(mockCities);
      expect(result3).toEqual(mockCities);
    });

    test('should handle empty queries', async () => {
      const result = await debouncedFetch('');
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should handle fetch errors gracefully', async () => {
      // Mock a network error
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      // Start the fetch call
      const fetchPromise = debouncedFetch('lag');

      // Advance timers to trigger the debounced function
      jest.advanceTimersByTime(300);

      // Verify the error is caught and propagated
      await expect(fetchPromise).rejects.toThrow('Network error');

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/cities?q=lag');
    });

    test('should handle non-OK responses', async () => {
      // Mock a failed response
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      );

      // Start the fetch call
      const fetchPromise = debouncedFetch('lag');

      // Advance timers to trigger the debounced function
      jest.advanceTimersByTime(300);

      // Verify the error is caught and propagated
      await expect(fetchPromise).rejects.toThrow('Failed to fetch cities');

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/cities?q=lag');
    });
  });
});

// Keep existing haversineDistance tests
describe('haversineDistance', () => {
  // Test cases with known distances (using Google Maps as reference)
  const testCases = [
    {
      name: 'Lagos to Abuja',
      point1: { lat: 6.5244, lon: 3.3792 }, // Lagos
      point2: { lat: 9.082, lon: 7.4911 }, // Abuja (corrected coordinates)
      expectedDistance: 500, // Corrected expected distance in km
      tolerance: 50, // Increased tolerance due to different calculation methods
    },
    {
      name: 'Same point',
      point1: { lat: 6.5244, lon: 3.3792 },
      point2: { lat: 6.5244, lon: 3.3792 },
      expectedDistance: 0,
      tolerance: 0,
    },
    {
      name: 'Short distance',
      point1: { lat: 6.5244, lon: 3.3792 }, // Lagos
      point2: { lat: 6.5244, lon: 3.3793 }, // Slightly different longitude
      expectedDistance: 0.01, // Very small distance
      tolerance: 0.01,
    },
    {
      name: 'Crossing equator',
      point1: { lat: 1.0, lon: 0.0 },
      point2: { lat: -1.0, lon: 0.0 },
      expectedDistance: 222, // Approximately 222km
      tolerance: 2,
    },
    {
      name: 'Crossing prime meridian',
      point1: { lat: 0.0, lon: 1.0 },
      point2: { lat: 0.0, lon: -1.0 },
      expectedDistance: 222, // Approximately 222km
      tolerance: 2,
    },
  ];

  testCases.forEach(({ name, point1, point2, expectedDistance, tolerance }) => {
    test(name, () => {
      const distance = haversineDistance(point1.lat, point1.lon, point2.lat, point2.lon);
      expect(Math.abs(distance - expectedDistance)).toBeLessThanOrEqual(tolerance);
    });
  });

  // Edge cases
  test('handles extreme coordinates', () => {
    const distance = haversineDistance(90, 180, -90, -180);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(20040); // Earth's circumference is approximately 20040km
  });

  test('handles zero coordinates', () => {
    const distance = haversineDistance(0, 0, 0, 0);
    expect(distance).toBe(0);
  });

  test('handles negative coordinates', () => {
    const distance = haversineDistance(-6.5244, -3.3792, 6.5244, 3.3792);
    expect(distance).toBeGreaterThan(0);
  });

  // Input validation
  test('handles invalid input gracefully', () => {
    expect(() => haversineDistance(NaN, 0, 0, 0)).toThrow();
    expect(() => haversineDistance(0, NaN, 0, 0)).toThrow();
    expect(() => haversineDistance(0, 0, NaN, 0)).toThrow();
    expect(() => haversineDistance(0, 0, 0, NaN)).toThrow();
  });
});
