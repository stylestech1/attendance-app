import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

type UserProfile = {
  id: string;
  jobId: number;
  name: string;
  email: string;
  position: string;
  phone: string;
  role: string;
};

interface UsersState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  profile: null,
  loading: false,
  error: null,
};

// Async thunk for fetching user profile data
export const fetchUserProfile = createAsyncThunk(
  'users/fetchUserProfile',
  async (token: string, { rejectWithValue }) => {
    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiURL}/api/v1/userDashboard/getMyData`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        return data.data;
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default usersSlice.reducer;
