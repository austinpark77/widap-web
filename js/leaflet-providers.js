(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['leaflet'], factory);
  } else if (typeof modules === 'object' && module.exports) {
    // define a Common JS module that relies on 'leaflet'
    module.exports = factory(require('leaflet'));
  } else {
    // Assume Leaflet is loaded into global object L already
    factory(L);
  }
}(this, function (L) {
  'use strict';

  L.TileLayer.Provider = L.TileLayer.extend({
    initialize: function (arg, options) {
      var providers = L.TileLayer.Provider.providers;

      var parts = arg.split('.');

      var providerName = parts[0];
      var variantName = parts[1];

      if (!providers[providerName]) {
        throw 'No such provider (' + providerName + ')';
      }

      var provider = {
        url: providers[providerName].url,
        options: providers[providerName].options
      };

      // overwrite values in provider from variant.
      if (variantName && 'variants' in providers[providerName]) {
        if (!(variantName in providers[providerName].variants)) {
          throw 'No such variant of ' + providerName + ' (' + variantName + ')';
        }
        var variant = providers[providerName].variants[variantName];
        var variantOptions;
        if (typeof variant === 'string') {
          variantOptions = {
            variant: variant
          };
        } else {
          variantOptions = variant.options;
        }
        provider = {
          url: variant.url || provider.url,
          options: L.Util.extend({}, provider.options, variantOptions)
        };
      }

      // replace attribution placeholders with their values from toplevel provider attribution,
      // recursively
      var attributionReplacer = function (attr) {
        if (attr.indexOf('{attribution.') === -1) {
          return attr;
        }
        return attr.replace(/\{attribution.(\w*)\}/,
          function (match, attributionName) {
            return attributionReplacer(providers[attributionName].options.attribution);
          }
        );
      };
      provider.options.attribution = attributionReplacer(provider.options.attribution);

      // Compute final options combining provider options with any user overrides
      var layerOpts = L.Util.extend({}, provider.options, options);
      L.TileLayer.prototype.initialize.call(this, provider.url, layerOpts);
    }
  });

  /**
   * Definition of providers.
   * see http://leafletjs.com/reference.html#tilelayer for options in the options map.
   */

  L.TileLayer.Provider.providers = {
    OpenStreetMap: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      },
      variants: {
        Mapnik: {},
        BlackAndWhite: {
          url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
          options: {
            maxZoom: 18
          }
        },
      }
    },
    Esri: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/{variant}/MapServer/tile/{z}/{y}/{x}',
      options: {
        variant: 'World_Street_Map',
        attribution: 'Tiles &copy; Esri'
      },
      variants: {
        WorldStreetMap: {
          options: {
            attribution:
              '{attribution.Esri} &mdash; ' +
              'Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
          }
        },
        DeLorme: {
          options: {
            variant: 'Specialty/DeLorme_World_Base_Map',
            minZoom: 1,
            maxZoom: 11,
            attribution: '{attribution.Esri} &mdash; Copyright: &copy;2012 DeLorme'
          }
        },
        WorldTopoMap: {
          options: {
            variant: 'World_Topo_Map',
            attribution:
              '{attribution.Esri} &mdash; ' +
              'Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
          }
        },
        WorldImagery: {
          options: {
            variant: 'World_Imagery',
            attribution:
              '{attribution.Esri} &mdash; ' +
              'Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          }
        },
        WorldTerrain: {
          options: {
            variant: 'World_Terrain_Base',
            maxZoom: 13,
            attribution:
              '{attribution.Esri} &mdash; ' +
              'Source: USGS, Esri, TANA, DeLorme, and NPS'
          }
        },
        WorldShadedRelief: {
          options: {
            variant: 'World_Shaded_Relief',
            maxZoom: 13,
            attribution: '{attribution.Esri} &mdash; Source: Esri'
          }
        },
        WorldPhysical: {
          options: {
            variant: 'World_Physical_Map',
            maxZoom: 8,
            attribution: '{attribution.Esri} &mdash; Source: US National Park Service'
          }
        },
        OceanBasemap: {
          options: {
            variant: 'Ocean_Basemap',
            maxZoom: 13,
            attribution: '{attribution.Esri} &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
          }
        },
        NatGeoWorldMap: {
          options: {
            variant: 'NatGeo_World_Map',
            maxZoom: 16,
            attribution: '{attribution.Esri} &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
          }
        },
        WorldGrayCanvas: {
          options: {
            variant: 'Canvas/World_Light_Gray_Base',
            maxZoom: 16,
            attribution: '{attribution.Esri} &mdash; Esri, DeLorme, NAVTEQ'
          }
        }
      }
    },
    NASAGIBS: {
      url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/{variant}/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
      options: {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        minZoom: 1,
        maxZoom: 9,
        format: 'jpg',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level'
      },
      variants: {
        ViirsEarthAtNight2012: {
          options: {
            variant: 'VIIRS_CityLights_2012',
            maxZoom: 8
          }
        },
      }
    },
    Wikimedia: {
      url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
      options: {
        attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
        minZoom: 1,
        maxZoom: 19
      }
    },
  };

  L.tileLayer.provider = function (provider, options) {
    return new L.TileLayer.Provider(provider, options);
  };

  return L;
}));
