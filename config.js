module.exports = {
    data_dir: 'data',
    classifications: [
        {
            market: 'btc-usd',
            slug: 'signals',
            filters: ['Bitcoin','bitcoin','BTC','btc'],
            output: 'btc-signals.json',
            dildo_gain: 0.75,
            flow_gain: 0.25,
            time_decay: 60, // Seconds
            sample_size: 1000
        }
    ]
};