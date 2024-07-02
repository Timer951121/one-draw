import pino from 'pino';

const loggingKeyPrefix = 'logging';
const logLevelKey = `${loggingKeyPrefix}-level`;

export const logger = pino({
    level: localStorage.getItem(logLevelKey) ?? process.env.REACT_APP_LOGLEVEL ?? 'info',
    timestamp: () => `",time":"${new Date(Date.now()).toISOString()}"`,
});

export const siteCalculationLogger = logger.child({
    category: 'siteCalculation',
});

const siteCalculationLogLevelKey = `${loggingKeyPrefix}-sitecalculation-level`;
siteCalculationLogger.level = localStorage.getItem(siteCalculationLogLevelKey) ?? process.env.REACT_APP_LOGLEVEL_SITE_CALCULATIONS ?? 'warn';

if (process.env.REACT_APP_FEATURE_LOGGING_CONFIG) {
    window.logging = {
        getLogLevel: () => logger.level,
        setLogLevel: (level) => {
            logger.level = level;
            localStorage.setItem(logLevelKey, level);
        },
        getSiteCalculationLogLevel: () => siteCalculationLogger.level,
        setSiteCalculationLogLevel: (level) => {
            siteCalculationLogger.level = level;
            localStorage.setItem(siteCalculationLogLevelKey, level);
        }
    };
}
