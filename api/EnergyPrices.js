'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

class EnergyPrices {

  getDate() {
    return new Date();
  }

  async getPrices() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const fromDate = date.toISOString();
    date.setDate(date.getDate() + 1);
    date.setHours(23, 59, 59, 999);
    const tillDate = date.toISOString();
    const url = `https://api.energyzero.nl/v1/energyprices?fromDate=${encodeURIComponent(fromDate)}&tillDate=${encodeURIComponent(tillDate)}&interval=4&usageType=1&inclBtw=true`;
    const prices = await fetch(url);

    if (!prices.ok) {
      throw new Error(prices.statusText);
    }
    return prices.json();
  }

  getCurrentPrice(prices, addHours = 0) {
    const now = this.getDate();
    now.setHours(now.getHours() + addHours, 0, 0, 0);
    const price = prices.Prices.find((entry) => {
      const d = new Date(entry.readingDate);
      return d.toISOString() === now.toISOString();
    });
    return price.price ?? null;
  }

}

module.exports = EnergyPrices;
