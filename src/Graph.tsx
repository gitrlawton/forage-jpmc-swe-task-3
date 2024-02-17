import React, { Component } from 'react';
import { Table, TableData } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
    // Before, we were tracking the changes in the two stocks' top_ask_price and
    // top_bid_price over time.
    // What we're actually interested in is the ratio of the price of the two stocks
    // over time.  We also want to track the upper_bound and lower_bound, and be alerted
    // when these bounds are crossed.
      price_abc: 'float',
      price_def: 'float',
      ratio: 'float',
      timestamp: 'date',
      upper_bound: 'float',
      lower_bound: 'float',
      trigger_alert: 'float',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      // The kind of graph we want to visualize the data with.
      elem.setAttribute('view', 'y_line');
      // Allows us to map each datapoint based on its timestamp.  Without it, the
      // x-axis would be blank.
      elem.setAttribute('row-pivots', '["timestamp"]');
      // Allows us to focus on a particular part of a datapoint's data along
      // the y-axis.  We want to track lower_bound, upper_bound, and trigger_alert.
      elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]');
      // Allows us to handle the duplicate data and consolidate them into one data point.
      elem.setAttribute('aggregates', JSON.stringify({
        price_abc: 'avg',
        price_def: 'avg',
        ratio: 'avg',
        timestamp: 'distinct count',
        upper_bound: 'avg',
        lower_bound: 'avg',
        trigger_alert: 'avg',
      }));
    }
  }

  // Gets executed whenever the component updates (ie. when the graph gets new data.)
  componentDidUpdate() {
    if (this.table) {
      this.table.update([
        DataManipulator.generateRow(this.props.data),
      ] as unknown as TableData);
    }
  }
}

export default Graph;
