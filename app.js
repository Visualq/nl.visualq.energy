'use strict';

const Homey = require('homey');
const Prices = require('./api/EnergyPrices');

class DynamicEnergy extends Homey.App {

  prices = [];
  currentPrice = null;

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('DynamicEnergy has been initialized');
    this.loadPrices();

    const priceChange = await this.homey.flow.getTriggerCard('pricechange');

    const averagePrice = await this.homey.flow.createToken('average_price', {
      type: 'number',
      title: this.homey.__('average_price'),
    });
    await averagePrice.setValue(parseFloat(this.prices.average));
    //
    const currentPrice = await this.homey.flow.createToken('current_price', {
      type: 'number',
      title: this.homey.__('current_price'),
    });

    const priceLTE = await this.homey.flow.getTriggerCard('pricelte');
    priceLTE.registerRunListener(async (args, state) => {
      if (typeof args.price === 'undefined') {
        return false;
      }
      this.log(`Is price ${state.price} less than or equal to ${args.price}`);
      return state.price <= args.price;
    });

    const priceGTE = await this.homey.flow.getTriggerCard('pricegte');
    priceGTE.registerRunListener(async (args, state) => {
      if (typeof args.price === 'undefined') {
        return false;
      }
      this.log(`Is price ${state.price} greater than or equal to ${args.price}`);
      return state.price >= args.price;
    });

    const priceLT = await this.homey.flow.getTriggerCard('pricelt');
    priceLT.registerRunListener(async (args, state) => {
      if (typeof args.price === 'undefined') {
        return false;
      }
      this.log(`Is price ${state.price} less than  ${args.price}`);
      return state.price < args.price;
    });

    const priceGT = await this.homey.flow.getTriggerCard('pricegt');
    priceGT.registerRunListener(async (args, state) => {
      if (typeof args.price === 'undefined') {
        return false;
      }
      this.log(`Is price ${state.price} greater than ${args.price}`);
      return state.price > args.price;
    });

    // Refresh every 24 hours
    setInterval(async () => {
      this.loadPrices();
      await averagePrice.setValue(this.prices.average);
    }, 86400000); // every 24 hours

    // manage price change
    setInterval(async () => {
      const api = new Prices();
      const newPrice = api.getCurrentPrice(this.prices);
      if (this.currentPrice === null) {
        this.log(`Setting current price to ${newPrice}`);
        this.currentPrice = newPrice;
        await currentPrice.setValue(this.currentPrice);
      }

      if (newPrice !== this.currentPrice) {
        const tokens = {
          price: newPrice,
        };
        this.log(`Price changed from ${this.currentPrice} to ${newPrice}`);
        await priceChange.trigger({
          old_price: this.currentPrice, ...tokens,
        });
        this.currentPrice = newPrice;
        await currentPrice.setValue(parseFloat(this.currentPrice));

        await priceLTE.trigger({ ...tokens }, { ...tokens });
        await priceGTE.trigger({ ...tokens }, { ...tokens });
        await priceLT.trigger({ ...tokens }, { ...tokens });
        await priceGT.trigger({ ...tokens }, { ...tokens });

      }
    }, 5000);
  }

  async loadPrices(averagePrice) {
    this.log('Loading prices');
    const api = new Prices();
    try {
      this.prices = await api.getPrices();
    } catch (e) {
      this.prices = {
        average: 0,
        prices: [],
      };
      throw e;
    }
  }

}

module.exports = DynamicEnergy;
