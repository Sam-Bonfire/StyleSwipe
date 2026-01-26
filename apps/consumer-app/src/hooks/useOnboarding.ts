import { calculateCentroid, Vector384 } from '@app/core';
import { useState, useEffect } from 'react';

import { STYLE_CLUSTERS } from '../data/StyleClusters';
import { ModelManager } from '../infrastructure/ModelManager';

export function useOnboarding() {
    const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>([]);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isModelReady, setIsModelReady] = useState(false);

    useEffect(() => {
        ModelManager.downloadModel((progress) => {
            setDownloadProgress(progress);
        }).then(() => {
            setIsModelReady(true);
        }).catch(err => {
            console.error("Failed to download model:", err);
        });
    }, []);

    const toggleCluster = (id: string) => {
        setSelectedClusterIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const calculateInitialDNA = (): Vector384 | null => {
        if (selectedClusterIds.length === 0) return null;

        const selectedVectors = STYLE_CLUSTERS
            .filter(c => selectedClusterIds.includes(c.id))
            .map(c => c.centroid);

        return calculateCentroid(selectedVectors);
    };

    return {
        clusters: STYLE_CLUSTERS,
        selectedClusterIds,
        toggleCluster,
        calculateInitialDNA,
        downloadProgress,
        isModelReady
    };
}
