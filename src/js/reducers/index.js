// (C) Copyright 2014-2015 Hewlett Packard Enterprise Development LP

import update from 'react/lib/update';
import { INDEX_LOAD, INDEX_QUERY, INDEX_SUCCESS, INDEX_UNLOAD,
  INDEX_SELECT, ROUTE_CHANGED } from '../actions';

const statusAttribute = {name: 'status', label: 'Status', size: 'small',
  header: true, filter: ['Critical', 'Warning', 'OK', 'Unknown']};

const activityCategoryMap = {alerts: 'Alert', tasks: 'Task'};

const initialState = {
  activeCategory: null,
  responsive: 'multiple',
  categories: {
    'enclosures': {
      label: "Enclosures",
      view: 'tiles',
      sort: 'name:asc',
      attributes: [
        statusAttribute,
        {name: 'name', label: 'Name', header: true}
      ]
    },
    'server-hardware': {
      label: "Server Hardware",
      view: 'list',
      sort: 'name:asc',
      attributes: [
        statusAttribute,
        {name: 'name', label: 'Name', header: true},
        {name: 'model', label: 'Model', secondary: true}
      ]
    },
    'server-profiles': {
      label: "Server Profiles",
      view: 'table',
      sort: 'name:asc',
      attributes: [
        statusAttribute,
        {name: 'name', label: 'Name', header: true}
      ],
      addRoute: '/server-profiles/add'
    },
    'activity': {
      category: ['alerts', 'tasks'],
      label: "Activity",
      view: 'table',
      sort: 'created:desc',
      attributes: [
        {name: 'associatedResourceName', label: 'Resource', size: 'medium'},
        statusAttribute,
        {name: 'name', label: 'Name', header: true},
        {name: 'created', label: 'Time',
          timestamp: true, size: 'medium', secondary: true},
        {name: 'state', label: 'State', size: 'medium', secondary: true,
          filter: [
            'Active', 'Cleared', 'Running', 'Completed'
          ]},
        {name: 'category', label: 'Category', secondary: true,
          filter: ['Alerts', 'Tasks'],
          render: function (item) {
            return activityCategoryMap[item.category] || '';
          }}
      ]
    }
  }
};

const handlers = {

  [INDEX_LOAD]: (state, action) => {
    let changes = { activeCategory: { $set: action.category }, categories: {} };
    if (state.activeCategory &&
      (! action.query || state.activeCategory !== action.category)) {
      changes.categories[state.activeCategory] = {query: { $set: null }};
    }
    if (action.query) {
      changes.categories[action.category] = {query: { $set: action.query }};
    }
    return update(state, changes);
  },

  [INDEX_UNLOAD]: (state, action) => {
    return update(state, {
      activeCategory: { $set: null },
      categories: {
        [state.activeCategory]: {
          watcher: { $set: null },
          result: { $set: null },
          query: { $set: null }
        }
      }
    });
  },

  [INDEX_QUERY]: (state, action) => {
    return update(state, {
      categories: {
        [action.category]: {
          query: { $set: action.query }
        }
      }
    });
  },

  [INDEX_SUCCESS]: (state, action) => {
    return update(state, {
      categories: {
        [action.category]: {
          watcher: { $set: action.watcher },
          result: { $set: action.result }
        }
      }
    });
  },

  [INDEX_SELECT]: (_, action)  => ({selection: action.selection}),

  [ROUTE_CHANGED]: (state, action) => {
    let result = {};
    const pathParts = action.route.pathname.split('/');
    const category = pathParts[1];
    if (state.categories.hasOwnProperty(category)) {
      result.activeCategory = category;
      // TODO: uris should be opaque, we need a cleaner way to extract the
      // selection uri
      const restParts = action.route.pathname.split('/rest');
      if (restParts.length < 2) {
        result.selection = null;
      } else {
        result.selection = '/rest' + restParts[1];
      }
    } else {
      result.activeCategory = null;
      result.selection = null;
    }
    return result;
  }
};

export default function indexReducer (state = initialState, action) {
  let handler = handlers[action.type];
  if (!handler) return state;
  return { ...state, ...handler(state, action) };
}
