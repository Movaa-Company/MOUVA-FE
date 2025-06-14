import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingForm from './bookingForm';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

jest.useFakeTimers();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock fetch for geocoding
global.fetch = jest.fn();

describe('BookingForm', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockToast = {
    toast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue(mockToast);

    // Mock successful geocoding response
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('nominatim.openstreetmap.org')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                address: {
                  city: 'Lagos',
                  road: 'Test Street',
                },
                display_name: 'Test Street, Lagos',
                lat: '6.5244',
                lon: '3.3792',
              },
            ]),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const renderBookingForm = () => {
    return render(<BookingForm onDestinationChange={jest.fn()} />);
  };

  describe('Form Validation', () => {
    test('should show validation errors for empty required fields', async () => {
      renderBookingForm();

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /proceed/i });
      await userEvent.click(submitButton);

      // Check for validation messages
      expect(await screen.findByText(/destination city is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/departure city is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/travel date is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/pick-up time is required/i)).toBeInTheDocument();
    });

    test('should validate children count against tickets', async () => {
      renderBookingForm();

      // Select number of tickets
      const ticketsSelect = screen.getByRole('combobox', { name: /no\. of tickets/i });
      await userEvent.selectOptions(ticketsSelect, '2');

      // Try to select more children than tickets
      const childrenSelect = screen.getByRole('combobox', { name: /children\?/i });
      await userEvent.selectOptions(childrenSelect, '3');

      // Check for validation message
      expect(
        await screen.findByText(/only one child per ticket booked is allowed/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('should submit form with valid data', async () => {
      renderBookingForm();

      // Fill in form fields
      await userEvent.type(screen.getByPlaceholderText(/travelling to/i), 'Abuja');
      await userEvent.type(screen.getByPlaceholderText(/from/i), 'Lagos');

      // Select date
      const dateButton = screen.getByRole('button', { name: /select date/i });
      await userEvent.click(dateButton);
      const today = new Date();
      const dateCell = screen.getByRole('gridcell', { name: today.getDate().toString() });
      await userEvent.click(dateCell);

      // Select time
      const timeSelect = screen.getByRole('button', { name: /select time/i });
      await userEvent.click(timeSelect);
      const timeOption = screen.getByRole('option', { name: '9:00 AM' });
      await userEvent.click(timeOption);

      // Select tickets
      const ticketsSelect = screen.getByRole('combobox', { name: /no\. of tickets/i });
      await userEvent.selectOptions(ticketsSelect, '2');

      // Select children
      const childrenSelect = screen.getByRole('combobox', { name: /children\?/i });
      await userEvent.selectOptions(childrenSelect, '1');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /proceed/i });
      await userEvent.click(submitButton);

      // Verify form submission
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('bookingData', expect.any(String));
      });

      // Verify booking data structure
      const bookingData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(bookingData).toMatchObject({
        destination: 'Abuja',
        from: expect.any(String),
        date: expect.any(String),
        time: '9:00 AM',
        tickets: 2,
        children: 1,
      });
    });

    test('should show auth dialog for unauthenticated users', async () => {
      renderBookingForm();

      // Fill in form fields
      await userEvent.type(screen.getByPlaceholderText(/travelling to/i), 'Abuja');
      await userEvent.type(screen.getByPlaceholderText(/from/i), 'Lagos');

      // Select date
      const dateButton = screen.getByRole('button', { name: /select date/i });
      await userEvent.click(dateButton);
      const today = new Date();
      const dateCell = screen.getByRole('gridcell', { name: today.getDate().toString() });
      await userEvent.click(dateCell);

      // Select time
      const timeSelect = screen.getByRole('button', { name: /select time/i });
      await userEvent.click(timeSelect);
      const timeOption = screen.getByRole('option', { name: '9:00 AM' });
      await userEvent.click(timeOption);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /proceed/i });
      await userEvent.click(submitButton);

      // Verify auth dialog is shown
      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Location Search', () => {
    test('should show location suggestions on input', async () => {
      renderBookingForm();

      const fromInput = screen.getByPlaceholderText(/from/i);
      await userEvent.type(fromInput, 'Lagos');

      act(() => {
        jest.advanceTimersByTime(500); // Advance past debounce time
      });

      await waitFor(
        () => {
          expect(screen.getByText('Test Street, Lagos')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    }, 15000);

    test('should handle location selection', async () => {
      renderBookingForm();

      const fromInput = screen.getByPlaceholderText(/from/i);
      await userEvent.type(fromInput, 'Lagos');

      act(() => {
        jest.advanceTimersByTime(500); // Advance past debounce time
      });

      await waitFor(
        () => {
          expect(screen.getByText('Test Street, Lagos')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await userEvent.click(screen.getByText('Test Street, Lagos'));
      expect(fromInput).toHaveValue('Test Street, Lagos');
    }, 15000);
  });

  describe('Park Selection', () => {
    test('should show nearest parks after location selection', async () => {
      renderBookingForm();

      const fromInput = screen.getByPlaceholderText(/from/i);
      await userEvent.type(fromInput, 'Lagos');

      act(() => {
        jest.advanceTimersByTime(500); // Advance past debounce time
      });

      await waitFor(
        () => {
          expect(screen.getByText('Test Street, Lagos')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await userEvent.click(screen.getByText('Test Street, Lagos'));

      await waitFor(
        () => {
          expect(screen.getByText(/closest park/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    }, 15000);

    test('should allow changing selected park', async () => {
      renderBookingForm();

      const fromInput = screen.getByPlaceholderText(/from/i);
      await userEvent.type(fromInput, 'Lagos');

      act(() => {
        jest.advanceTimersByTime(500); // Advance past debounce time
      });

      await waitFor(
        () => {
          expect(screen.getByText('Test Street, Lagos')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await userEvent.click(screen.getByText('Test Street, Lagos'));

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await userEvent.click(screen.getByRole('button', { name: /change/i }));
      expect(screen.getByPlaceholderText(/search parks/i)).toBeInTheDocument();
    }, 15000);
  });
});
