var tooltipUtil = function() {

  function update_position(event) {
    d3.select("#vis-tooltip")
    .style("top", function() {
      // by default: put tooltip 10px below cursor
      // if tooltip is close to the bottom of the window, put tooltip 10px above cursor
      var tooltipHeight = parseInt(d3.select(this).style("height"));
      if (event.clientY + tooltipHeight + 10 < window.innerHeight) {
        return "" + (event.clientY + 10) + "px";
      } else {
        return "" + (event.clientY - tooltipHeight - 10) + "px";
      }
    })
    .style("left", function() {
      // by default: put tooltip 10px to the right of cursor
      // if tooltip is close to the right edge of the window, put tooltip 10 px to the left of cursor
      var tooltipWidth = parseInt(d3.select(this).style("width"));
      if (event.clientX + tooltipWidth + 10 < window.innerWidth) {
        return "" + (event.clientX + 10) + "px";
      } else {
        return "" + (event.clientX - tooltipWidth - 10) + "px";
      }
    });
  }

  return {
    fill: function (event, item, options) {
      if (!item || !item.datum) return;

      // avoid showing tooltip for facet's background
      if (item.datum._facetID) return;

      // avoid showing tooltip for axis title and labels
      if (!item.datum._id) return;

      var itemData = d3.map(item.datum);

      // if options is not empty, show fields in options
      // if options is empty, auto determine fields to show
      if (options && options.length > 0) {
        var opt = d3.map(options, function(d) { return d.field; });
        itemData.forEach(function(key, value) {
          if(opt.has(key)) {
            // keep the field in tooltip
            // format the field for tooltip
          }
          else {
            // remove field from tooltip
            itemData.remove(key);
          }
        })
      }
      else {
        console.log("empty: " + options);
        // remove vega internals
        itemData.remove("_id");
        itemData.remove("_prev");
      }


      // get array of key value pairs for tooltip
      var tooltipData = itemData.entries();

      // TODO(zening): show partial data in tooltip
      var tooltipRows = d3.select("#vis-tooltip").selectAll(".tooltip-row").data(tooltipData);

      tooltipRows.exit().remove();

      var row = tooltipRows.enter().append("tr")
      .attr("class", "tooltip-row");
      row.append("td").attr("class", "key").text(function(d) { return d.key + ":"; });
      row.append("td").attr("class", "value").text(function(d) {
        var timeFormatter = dl.format.auto.time();
        switch(dl.type(d.value)) {
          case "date": return timeFormatter(d.value);
          default: return d.value;
        }
      });

      update_position(event);
      d3.select("#vis-tooltip").style("opacity", 1);
    },
    update: function(event, item) {
      update_position(event);
    },
    clear: function() {
      var tooltipRows = d3.select("#vis-tooltip").selectAll(".tooltip-row").data([]);
      tooltipRows.exit().remove();
      d3.select("#vis-tooltip").style("opacity", 0);
    }
  }
}();

var vgTooltip = function() {
  return {
    linkToView: function(view, options) {
      // parse options
      // options contain field, fieldTitle, type, format
      // pass in options to fill
      // 1. options 2. datalib.auto

      // fill tooltip with data
      view.on("mouseover", function(event, item) {
        tooltipUtil.fill(event, item, options);
      });

      // update tooltip position on mouse move
      // (important for large marks e.g. bars)
      view.on("mousemove", tooltipUtil.update);

      // clear tooltip
      view.on("mouseout", tooltipUtil.clear);
    }
  }
}();

var vlTooltip = function() {

  function combineOptions(vlSpec, opt) {
    // opt contains all the fields that should be displayed
    // if option is empty, 1. display all fields, 2. infer format from vlSpec, 3. infer using datalib.auto
    // if option is not empty, 1. read opt fields first, 2. if opt does not contain format for a field, infer from vlSpec, 3. if vlSpec also does not contain format for a field, infer from datalib.auto
    var options = [];

    // get time unit if contained in vlSpec
    vl.spec.fieldDefs(vlSpec).forEach(function(channel) {
      if(channel.timeUnit) {

      }
    });
  }

  return {
    linkToView: function(view, options, vlSpec) {
      // combine options with vlSpec options
      // 1. options 2. vlSpec 3. datalib.auto
      // opt contains field, fieldTitle, type, format
      // pass options to fill
      // combineOptions(vlSpec, options);

      // fill tooltip with data
      view.on("mouseover", function(event, item) {
        tooltipUtil.fill(event, item, options);
      });

      // update tooltip position on mouse move
      // (important for large marks e.g. bars)
      view.on("mousemove", tooltipUtil.update);

      // clear tooltip
      view.on("mouseout", tooltipUtil.clear);
    }
  }
}()
