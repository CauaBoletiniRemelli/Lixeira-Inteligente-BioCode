import { useState, useEffect } from 'react';
import { binService } from '../services';
import { Bin } from '../types';
import { mockBins } from '../utils/mockData';

export const useBins = () => {
    const [bins, setBins] = useState<Bin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBins = async () => {
        try {
            setLoading(true);
            setError(null);

            await new Promise(resolve => setTimeout(resolve, 1000));

            setBins(mockBins);

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
