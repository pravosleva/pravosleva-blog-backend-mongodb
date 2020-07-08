"use strict";
const slugify = require("slugify");

/**
 * Lifecycle callbacks for the `article` model.
 */

function debounce(f, ms) {
  let timer = null;

  return function (...args) {
    const onComplete = () => {
      f.apply(this, args);
      timer = null;
    };

    if (timer) clearTimeout(timer);
    timer = setTimeout(onComplete, ms);
  };
}

const debouncedAfterUpdate = debounce(({ model }) => {
  console.log("=== debounced socket.emit for afterUpdate webhook");
  console.log(model);
  strapi.io.emit("ARTICLE_UPDATED", {
    id: model._conditions ? model._conditions._id : null,
    slug: model._conditions ? model._conditions.slug : null,
  });
}, 4000);

const debouncedAfterCreate = debounce(({ model }) => {
  console.log("=== debounced socket.emit for afterCreate webhook");
  console.log(model);
  strapi.io.emit("ARTICLE_UPDATED", {
    id: model._conditions ? model._conditions._id : null,
    slug: model._conditions ? model._conditions.slug : null,
  });
}, 4000);

module.exports = {
  // DOCS: https://strapi.io/documentation/v3.x/guides/slug.html#auto-create-update-the-slug-attribute
  // lifecycle? WTF?

  // Before saving a value.
  // Fired before an `insert` or `update` query.
  // beforeSave: async (model, attrs, options) => {},

  // After saving a value.
  // Fired after an `insert` or `update` query.
  // afterSave: async (model, response, options) => {},

  // Before fetching a value.
  // Fired before a `fetch` operation.
  // beforeFetch: async (model, columns, options) => {},

  // After fetching a value.
  // Fired after a `fetch` operation.
  // afterFetch: async (model, response, options) => {},

  // Before fetching all values.
  // Fired before a `fetchAll` operation.
  // beforeFetchAll: async (model, columns, options) => {},

  // After fetching all values.
  // Fired after a `fetchAll` operation.
  // afterFetchAll: async (model, response, options) => {},

  // Before creating a value.
  // Fired before an `insert` query.
  // beforeCreate: async (model, attrs, options) => {},

  // After creating a value.
  // Fired after an `insert` query.
  // afterCreate: async (model, attrs, options) => {},
  afterCreate: async (model, attrs, _options) => {
    debouncedAfterCreate({ model, attrs });
  },

  // Before updating a value.
  // Fired before an `update` query.
  beforeUpdate: async (model) => {
    // console.log("2.1 beforeUpdate, model= ", model._update);
    if (!!model._update.title) {
      model._update.slug = await slugify(model._update.title).toLowerCase();
    }
  },

  // After updating a value.
  // Fired after an `update` query.
  // afterUpdate: async (model, attrs, options) => {},
  afterUpdate: async (model, result) => {
    debouncedAfterUpdate({ model, result });
  },

  // Before destroying a value.
  // Fired before a `delete` query.
  // beforeDestroy: async (model, attrs, options) => {},

  // After destroying a value.
  // Fired after a `delete` query.
  // afterDestroy: async (model, attrs, options) => {}
};
