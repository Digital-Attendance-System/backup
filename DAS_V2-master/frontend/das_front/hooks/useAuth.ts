import { useContext } from 'react';
import { AuthContext, useAuth as useAuthContext } from '../contexts/AuthContext';

// just re-export
export const useAuth = useAuthContext;
