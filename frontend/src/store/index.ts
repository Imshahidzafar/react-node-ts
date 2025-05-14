import { useDispatch, useSelector } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
// Since we're using Zustand, we don't need Redux store configuration
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

export const store = configureStore({
  reducer: {
  },
});
