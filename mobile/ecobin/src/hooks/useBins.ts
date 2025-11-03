import { useState, useEffect } from 'react';
import { binService } from '../services';
import { Bin } from '../types';
import { mockBins } from '../utils/mockData';

/**
 * Hook para gerenciar lixeiras
 */
export const useBins = () => {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulando delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Usando dados mock - substitua por binService.getAll() quando tiver API real
      setBins(mockBins);
      
      // Para usar API real, descomente a linha abaixo:
      // const data = await binService.getAll();
      // setBins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lixeiras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, []);

  const refetch = () => {
    fetchBins();
  };

  return { bins, loading, error, refetch };
};
