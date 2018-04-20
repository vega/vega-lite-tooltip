import {EnterElement, select, Selection} from 'd3-selection';
import {Option, TooltipData} from './options';

/**
 * Get the tooltip HTML placeholder by id selector "#vis-tooltip"
 * If none exists, create a placeholder.
 * @returns the HTML placeholder for tooltip
 */
export function getTooltipPlaceholder(tooltipId: string) {
  let tooltipPlaceholder = select('#' + tooltipId);

  if (tooltipPlaceholder.empty()) {
    tooltipPlaceholder = select('body').append('div')
      .attr('id', tooltipId)
      .attr('class', 'vg-tooltip');
  }

  return tooltipPlaceholder;
}

/**
 * Bind tooltipData to the tooltip placeholder
 */
export function bindData(tooltipPlaceholder: Selection<Element | EnterElement | Document | Window, {}, HTMLElement, any>, tooltipData: TooltipData[]) {
  tooltipPlaceholder.selectAll('table').remove();
  const tooltipRows = tooltipPlaceholder.append('table').selectAll('.tooltip-row')
    .data(tooltipData);

  tooltipRows.exit().remove();

  tooltipRows.enter().append('tr')
    .attr('class', 'tooltip-row')
    .each(function(d) {
      const sel = select(this);
      if (d.render) {
        sel.append('td')
          .attr('colspan', '2')
          .append(() => d.render(d.title, d.value));
      } else {
        sel.append('td').attr('class', 'key').text(function (data: TooltipData) { return data.title + ':'; });
        sel.append('td').attr('class', 'value').text(function (data: TooltipData) { return data.value; });
      }
    });
}

/**
 * Clear tooltip data
 */
export function clearData(tooltipId: string) {
  select('#' + tooltipId).selectAll('.tooltip-row').data([])
    .exit().remove();
}

/**
 * Update tooltip position
 * Default position is 10px right of and 10px below the cursor. This can be
 * overwritten by options.offset
 */
export function updatePosition(event: MouseEvent, options: Option, tooltipId: string) {
  // determine x and y offsets, defaults are 10px
  let offsetX = 10;
  let offsetY = 10;
  if (options && options.offset && (options.offset.x !== undefined) && (options.offset.x !== null)) {
    offsetX = options.offset.x;
  }
  if (options && options.offset && (options.offset.y !== undefined) && (options.offset.y !== null)) {
    offsetY = options.offset.y;
  }

  // TODO: use the correct time type
  select('#' + tooltipId)
    .style('top', function (this: HTMLElement) {
      // by default: put tooltip 10px below cursor
      // if tooltip is close to the bottom of the window, put tooltip 10px above cursor
      const tooltipHeight = this.getBoundingClientRect().height;
      if (event.clientY + tooltipHeight + offsetY < window.innerHeight) {
        return '' + (event.clientY + offsetY) + 'px';
      } else {
        return '' + (event.clientY - tooltipHeight - offsetY) + 'px';
      }
    })
    .style('left', function (this: HTMLElement) {
      // by default: put tooltip 10px to the right of cursor
      // if tooltip is close to the right edge of the window, put tooltip 10 px to the left of cursor
      const tooltipWidth = this.getBoundingClientRect().width;
      if (event.clientX + tooltipWidth + offsetX < window.innerWidth) {
        return '' + (event.clientX + offsetX) + 'px';
      } else {
        return '' + (event.clientX - tooltipWidth - offsetX) + 'px';
      }
    });
}

/* Clear tooltip position */
export function clearPosition(tooltipId: string) {
  select('#' + tooltipId)
    .style('top', '-9999px')
    .style('left', '-9999px');
}

/**
 * Update tooltip color theme according to options.colorTheme
 *
 * If colorTheme === "dark", apply dark theme to tooltip.
 * Otherwise apply light color theme.
 */
export function updateColorTheme(options: Option, tooltipId: string) {
  clearColorTheme(tooltipId);

  if (options && options.colorTheme === 'dark') {
    select('#' + tooltipId).classed('dark-theme', true);
  } else {
    select('#' + tooltipId).classed('light-theme', true);
  }
}

/* Clear color themes */
export function clearColorTheme(tooltipId: string) {
  select('#' + tooltipId).classed('dark-theme light-theme', false);
}
