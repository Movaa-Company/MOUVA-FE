const USER_STORAGE_KEY = 'user';
const LOGGED_IN_USER_KEY = 'loggedInUser';
const BOOKING_DATA_KEY = 'bookingData';

// User data operations
export const saveUser = (userData: any) => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data to localStorage:', error);
  }
};

export const getUser = () => {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data from localStorage:', error);
    return null;
  }
};

export const clearUser = () => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    clearLoggedInUser();
  } catch (error) {
    console.error('Error clearing user data from localStorage:', error);
  }
};

// Logged-in user operations
export const setLoggedInUser = (phone: string) => {
  try {
    localStorage.setItem(LOGGED_IN_USER_KEY, phone);
  } catch (error) {
    console.error('Error setting logged in user in localStorage:', error);
  }
};

export const getLoggedInUser = () => {
  try {
    return localStorage.getItem(LOGGED_IN_USER_KEY);
  } catch (error) {
    console.error('Error getting logged in user from localStorage:', error);
    return null;
  }
};

export const clearLoggedInUser = () => {
  try {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
  } catch (error) {
    console.error('Error clearing logged in user from localStorage:', error);
  }
};

// Booking data operations
export const saveBookingData = (bookingData: any) => {
  try {
    localStorage.setItem(BOOKING_DATA_KEY, JSON.stringify(bookingData));
  } catch (error) {
    console.error('Error saving booking data to localStorage:', error);
  }
};

export const getBookingData = () => {
  try {
    const bookingData = localStorage.getItem(BOOKING_DATA_KEY);
    return bookingData ? JSON.parse(bookingData) : null;
  } catch (error) {
    console.error('Error getting booking data from localStorage:', error);
    return null;
  }
};

export const clearBookingData = () => {
  try {
    localStorage.removeItem(BOOKING_DATA_KEY);
  } catch (error) {
    console.error('Error clearing booking data from localStorage:', error);
  }
};
