import { NavigationContainerRef } from '@react-navigation/native';

import { logger } from './logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const navigationRef: React.RefObject<NavigationContainerRef<any>> = { current: null };

export const onNavigationStateChange = () => {
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

    if (currentRouteName) {
        logger.addBreadcrumb({
            category: 'navigation',
            message: `Navigated to ${currentRouteName}`,
            data: {
                route: currentRouteName,
            },
        });
        // logger.info(`Screen View: ${currentRouteName}`, { screen: currentRouteName });
    }
};
