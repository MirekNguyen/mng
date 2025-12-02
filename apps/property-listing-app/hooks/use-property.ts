import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const fetchProperties = async () => {
  const response = await axios.get(`${API_URL}/property`);
  return response.data;
};

export const useProperties = () => {
  return useQuery({
    queryKey: ['property'],
    queryFn: fetchProperties,
    staleTime: 1000 * 60 * 5, 
  });
};
