/**
 * Export Vega Tooltip API: vgTooltip.linkToView(vgView, options)
 * options can specify data fields to show in the tooltip and can
 * provide data formats for those fields
 */
var vgTooltip = (function() {
  return function(vgView, options) {
      if (!options) {
        options = {};
      }

      // initialize tooltip with data
      vgView.on("mouseover", function(event, item) {
        tooltipUtil.init(event, item, options);
      });

      // update tooltip position on mouse move
      // (important for large marks e.g. bars)
      vgView.on("mousemove", function(event, item) {
        tooltipUtil.update(event, item, options);
      });

      // clear tooltip
      vgView.on("mouseout", tooltipUtil.clear);
    }
}());

/**
 * Export Vega-Lite Tooltip API: vlTooltip.linkToView(vgView, vlSpec, options)
 * options can specify data fields to show in the tooltip and can
 * overwrite data formats in vlSpec
 */
var vlTooltip = (function() {

  // supplement options with timeUnit and numberFormat from vlSpec
  function supplementOptions(options, vlSpec) {
    // supplement numberFormat
    if (vlSpec.config && vlSpec.config.numberFormat) {
      options.numberFormat = vlSpec.config.numberFormat;
    }

    // supplement timeUnit
    vl.spec.fieldDefs(vlSpec).forEach(function(channel) {
      if (channel.timeUnit) {
        if (!options.fieldsWithTimeUnit) {
          options.fieldsWithTimeUnit = [];
        }
        try {
          // TODO(zening): rename field because VL renames field
          // e.g. date --> month_date, date --> year_date
          var renamedField = channel.timeUnit + '_' + channel.field;
          options.fieldsWithTimeUnit.push({field: renamedField, timeUnit: channel.timeUnit});
        }
        catch (error) {
          console.error('[VgTooltip] Error parsing Vega-Lite timeUnit: ' + error);
        }
      }
    });

    return options;
  }

  return function(vgView, vlSpec, options) {
      if (!options) {
        options = {};
      }

      options = supplementOptions(options, vlSpec);

      // initialize tooltip with data
      vgView.on("mouseover", function(event, item) {
        tooltipUtil.init(event, item, options);
      });

      // update tooltip position on mouse move
      // (important for large marks e.g. bars)
      vgView.on("mousemove", function(event, item) {
        tooltipUtil.update(event, item, options);
      });

      // clear tooltip
      vgView.on("mouseout", tooltipUtil.clear);
    }
}());

/**
 * Export common utilities: init, update and clear
 * init(): initialize tooltip with data
 * update(): update tooltip as mouse moves
 * clear(): clear tooltip data
 */
var tooltipUtil = (function() {

  /* Decide if a chart element deserves tooltip */
  function shouldShowTooltip (item) {
    if (!item || !item.datum) return false;

    // avoid showing tooltip for facet's background
    if (item.datum._facetID) return false;

    // avoid showing tooltip for axis title and labels
    if (!item.datum._id) return false;

    return true;
  }

  /**
   * Prepare data to be bound to the tooltip element
   * @return [{ title: ..., value: ...}]
   */
  function getTooltipData(item, options) {

    /**
     * Prepare custom fields (specified by options) for tooltip.
     * When options or vlSpec provides custom format for a field, apply custom format.
     * Otherwise, automatically format the field.
     * options can always overwrite format provided by vlSpec.
     * @return Field title and value array, ready to be formatted:
     * [{ title: ..., value: ...}]
     */
    function getCustomFields(item, options) {

      /**
       * Get one field value from an item's datum,
       * even if the field is not at top-level of item.datum.
       * @return the field value if successful,
       * undefined if the field cannot be found in item.datum
       */
      function getValue(datum, field) {
        if (field.includes('.')) {
          var accessors = field.split('.');
          var value = datum;
          var path = '';
          accessors.forEach(function(a) {
            if (value[a]) {
              value = value[a];
              path = path + '.' + a;
            }
            else {
              console.warn('[VgTooltip] Cannot find field ' + path + ' in data.');
              return undefined;
            }
          });
          return value;
        }
        else {
          if (datum[field]) {
            return datum[field];
          }
          else {
            console.warn('[VgTooltip] Cannot find field ' + field + ' in data.');
            return undefined;
          }
        }
      }


      var content = [];

      options.fields.forEach(function(fld) {
        var value = getValue(item.datum, fld);
        if (value != undefined)
        {
          content.push({name: fld, value: value});
        }


        // var title = opt.fieldTitle ? opt.fieldTitle : opt.field;
        // var value = getFieldValue(item.datum, opt.field);
        //
        // var formattedValue;
        //
        // // if either type or format is missing, apply auto format
        // // else if both type and format exist, apply custom format
        // if (!opt.type || !opt.format) {
        //   formattedValue = autoFormat(opt.field, value, options);
        // }
        // else {
        //   formattedValue = custFormat(opt, value);
        // }
        //
        // content.push({fieldTitle: title, fieldValue: formattedValue});
      });

      return content;
    }

    /**
     * Prepare default fields (top-level fields of item.datum) for tooltip.
     * @return Field title and value array, ready to be formatted:
     * [{ title: ..., value: ...}]
     */
    function getDefaultFields(item, options) {
      var content = [];

      var itemData = d3.map(item.datum);
      itemData.remove("_id");
      itemData.remove("_prev");

      itemData.forEach(function(field, value) {
        content.push({name: field, value: value});
      })
      // drop number and date data for line charts and area charts (#1)
      // if (item.mark.marktype === "line" || item.mark.marktype === "area") {
      //   console.warn('[VgTooltip]: By default, we only show qualitative data in tooltip.');
      //
      //   itemData.forEach(function(field, value) {
      //     switch (dl.type(value)) {
      //       case 'boolean':
      //       case 'string':
      //         content.push({fieldTitle: field, fieldValue: value});
      //         break;
      //       case 'number':
      //       case 'date':
      //       default:
      //         break;
      //     }
      //   })
      // }
      // else {
      //   itemData.forEach(function(field, value) {
      //     var formattedValue = autoFormat(field, value, options);
      //     content.push({fieldTitle: field, fieldValue: formattedValue});
      //   });
      // }

      return content;
    }

    /**
     * Format field titles according to options
     * In the future we are also going to format the field titles according to vlSpec
     * so that users have less to specify in options
     * @return tooltipData with formated field titles
     */
    function formatFieldTitles(tooltipData, options) {
      tooltipData.forEach(function(field) {
        field.title = "";

        // try to get a custom field title from options
        if (options.fieldConfigs && options.fieldConfigs.length > 0) {
          var configs = d3.map(options.fieldConfigs, function(d) { return d.field; });
          if ( configs.get(field.name) && configs.get(field.name).title ) {
            field.title = configs.get(field.name).title;
            return;
          }
        }

        // TODO(zening): try to get a custom field title from vlSpec (e.g. axis title, legend title)

        // if neither options nor vlSpec provides custom field title,
        // set field title equal to field name
        field.title = field.name;
      });

      return tooltipData;
    }

    /**
     * Format field values according to (1) options, (2) vlSpec, (3) datalib auto format
     * @return tooltipData with formated field values
     */
    function formatFieldValues(tooltipData, options) {

      /**
       * Try format a field according to options
       * @return the formatted value if options provides both type and format for the field
       * undefined if options doesn't provide both type and format for the field
       */
      function optFormat(field, options) {
        // if options doesn't have fieldConfigs, return undefined
        if (!options.fieldConfigs || options.fieldConfigs.length <= 0) return;

        // if options provides type and format for the field, use them, and return the formatted value
        var configs = d3.map(options.fieldConfigs, function(d) { return d.field; });
        if ( configs.get(field.name) && configs.get(field.name).value ) {
          var fmt = configs.get(field.name).value;
          if (fmt.type && fmt.format) {
            var formattedValue = applyFormat(fmt.type, fmt.format, field.value);
            return formattedValue;
          }
        }

        // options doesn't provide type and format for the field, return undefined
        return;
      }

      /**
       * Apply a format to a date, number, or string value
       * @return the formatted value
       */
      function applyFormat(type, format, value) {
        var formattedValue;
        switch (type) {
          case 'date':
            // format can be a Vega-Lite timeUnit or simply a string specifier
            if (vl.timeUnit.TIMEUNITS.indexOf(format) > -1) {
              var specifier = vl.timeUnit.format(format)
              var formatter = dl.format.time(specifier);
              formattedValue = formatter(value);
            }
            else {
              var formatter = dl.format.time(format);
              formattedValue = formatter(value);
            }
            break;
          case 'number':
            // number is a string specifier
            var formatter = dl.format.number(format);
            formattedValue = formatter(value);
            break;
          case 'string':
          default:
            formattedValue = value;
        }
        return formattedValue;
      }

      tooltipData.forEach(function(field) {
        console.log(field.title + ": " + field.value);

        // 1. try to format a field by options
        var formattedValue = optFormat(field, options) || field.value;

        // 2. try to format a field by vlSpec

        // 3. auto format
        field.value = formattedValue;

      });

      return tooltipData;
    }

    /**
     * Automatically format a date, number or string value
     * @return the formated data, number or string value
     */
    function autoFormat(field, value, options) {

      // check if timeUnit applies to the field
      if (options.fieldsWithTimeUnit) {
        var timeFields = d3.map(options.fieldsWithTimeUnit, function(d) { return d.field; });
        if (timeFields.has(field)) {
          var specifier = vl.timeUnit.format(timeFields.get(field).timeUnit);
          var formatter = dl.format.time(specifier);
          return formatter(value);
        }
      }

      // format other date, number, string values
      switch (dl.type(value)) {
        case 'date':
          var formatter = dl.format.auto.time();
          return formatter(value);
        case 'number':
          if (options.numberFormat) {
            var formatter = dl.format.number(options.numberFormat);
            return formatter(value);
          }
        case 'boolean':
        case 'string':
        default:
          return value;
      }
    }

    // this array will be bind to the tooltip element
    var tooltipData;

    // decide which fields to show in the tooltip
    if ( options && options.fields && options.fields.length > 0 ) {
      tooltipData = getCustomFields(item, options);
    }
    else {
      tooltipData = getDefaultFields(item, options);
    }

    // TODO(zening): binned fields
    // TODO(zening): count, count_start, count_end, layout_mid
    // TODO(zening): don't show layout (layout_start, layout_mid, layout_end, layout_path, layout_x, layout_y)
    // TODO(zening): perhaps also remove _id and _prev here?
    // TODO(zening): drop quantitative fields for area and line charts

    tooltipData = formatFieldTitles(tooltipData, options);

    tooltipData = formatFieldValues(tooltipData, options);

    return tooltipData;
  }

  /**
   * Bind data to the tooltip element
   */
  function bindData(tooltipData) {
    var tooltipRows = d3.select("#vis-tooltip").selectAll(".tooltip-row").data(tooltipData);

    tooltipRows.exit().remove();

    var row = tooltipRows.enter().append("tr")
    .attr("class", "tooltip-row");
    row.append("td").attr("class", "key").text(function(d) { return d.title + ":"; });
    row.append("td").attr("class", "value").text(function(d) { return d.value; });
  }

  /**
   * Clear tooltip data
   */
  function clearData() {
    var tooltipRows = d3.select("#vis-tooltip").selectAll(".tooltip-row").data([]);
    tooltipRows.exit().remove();
  }

  /**
   * Update tooltip position
   * Default position is 10px right of and 10px below the cursor. This can be
   * overwritten by options.
   */
  function updatePosition(event, options) {
    // determine x and y offsets, defaults are 10px
    var offsetX = 10;
    var offsetY = 10;
    if (options && options.offset && !(options.offset.x === undefined)) {
      offsetX = options.offset.x;
    }
    if (options && options.offset && !(options.offset.y === undefined)) {
      offsetY = options.offset.y;
    }

    d3.select("#vis-tooltip")
    .style("top", function() {
      // by default: put tooltip 10px below cursor
      // if tooltip is close to the bottom of the window, put tooltip 10px above cursor
      var tooltipHeight = parseInt(d3.select(this).style("height"));
      if (event.clientY + tooltipHeight + offsetY < window.innerHeight) {
        return "" + (event.clientY + offsetY) + "px";
      } else {
        return "" + (event.clientY - tooltipHeight - offsetY) + "px";
      }
    })
    .style("left", function() {
      // by default: put tooltip 10px to the right of cursor
      // if tooltip is close to the right edge of the window, put tooltip 10 px to the left of cursor
      var tooltipWidth = parseInt(d3.select(this).style("width"));
      if (event.clientX + tooltipWidth + offsetX < window.innerWidth) {
        return "" + (event.clientX + offsetX) + "px";
      } else {
        return "" + (event.clientX - tooltipWidth - offsetX) + "px";
      }
    });
  }

  /* Update tooltip color theme according to options.colorTheme */
  function updateTheme(options) {
    if (options && options.colorTheme) {
      clearTheme();
      switch (options.colorTheme) {
        case 'dark':
          d3.select("#vis-tooltip").classed('dark-theme', true);
          break;
        case 'light':
        default:
      }
    }

  }

  /* Reset color themes to default */
  function clearTheme() {
    d3.select("#vis-tooltip").classed('dark-theme light-theme', false);
  }

  return {
    init: function(event, item, options) {
      if( shouldShowTooltip(item) === false ) return;

      // prepare data for tooltip
      var tooltipData = getTooltipData(item, options);
      if (!tooltipData || tooltipData.length === 0) return;

      bindData(tooltipData);

      updatePosition(event, options);
      updateTheme(options);
      d3.select("#vis-tooltip").style("opacity", 1);
    },
    update: function(event, item, options) {
      updatePosition(event, options);
    },
    clear: function() {
      clearData();
      clearTheme();
      d3.select("#vis-tooltip").style("opacity", 0);
    }
  }
}());
