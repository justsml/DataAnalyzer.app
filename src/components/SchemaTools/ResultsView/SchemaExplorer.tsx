import { trackCustomEvent } from 'hooks/useAnalytics';
import React from 'react';
import Chart from 'react-apexcharts';
import { FieldInfo, TypeSummary } from 'schema-analyzer';

const getFieldNames = (schemaResults: TypeSummary<FieldInfo>) => {
  return Object.keys(schemaResults.fields);
};

const getTypeCounts = (schemaResults: TypeSummary<FieldInfo>) => {
  return Object.entries(schemaResults.fields).reduce((typeCounts, [fieldName, typeInfo]) => {
    const { types } = typeInfo;
    Object.keys(types).forEach((typeName) => {
      typeCounts[typeName] = typeCounts[typeName] || 0;
      typeCounts[typeName]++;
    });
    return typeCounts;
  }, {});
};

const getFieldLabeledData = (schemaResults: TypeSummary<FieldInfo>) => {
  const { fields } = schemaResults;
  const fieldNames = Object.keys(fields);
  const typesList = Object.keys(getTypeCounts(schemaResults));
  // console.log('typesList', typesList);
  return typesList.map((type) => {
    return {
      name: type,
      data: fieldNames.map((fieldName) => {
        // console.log(
        //   'fields[fieldName].types[type]',
        //   fields[fieldName],
        //   fields[fieldName]!.types[type],
        // );
        return fields[fieldName]!.types[type] ? fields[fieldName]!.types[type].count : 0;
      }),
    };
  });
  // return Object.entries(fields)
  //   .map(([fieldName, typeInfo]) => {
  //     const { types, enum: enumData, unique, nullable } = typeInfo
  //     const sortedTypes = getOrderedTypes(types)
  //     // const topTypeCount = sortedTypes[1].count
  //     if (enumData) fieldName = `${fieldName}(${enumData.length})`
  //     if (unique) fieldName = `${fieldName}*`
  //     if (nullable) fieldName = `[${fieldName}]`
  //     const dataPoints = typesList.map(typeName => types[typeName] && types[typeName].count || 0)
  //     console.warn(types, dataPoints)
  //     return {
  //       name: fieldName,
  //       data: dataPoints
  //     }
  //   })
};

// const getOrderedTypes = (types) => {
//   if (!Array.isArray(types)) types = Object.entries(types)
//   return types = types.slice(0)
//     // .filter(f => f[0] !== 'Null' && f[0] !== 'Unknown')
//     .sort((a, b) => a[1].count > b[1].count ? -1 : a[1].count === b[1].count ? 0 : 1)
// }
type Props = {
  schemaResults: TypeSummary<FieldInfo> | null | undefined;
};
const pixelHeightPerField = 30; // 21.75
// NOTE: Additional color sets available here: https://apexcharts.com/docs/options/theme/
const colorSets = {
  pastels: ['#abc7e3', '#fff7b3', '#ffc097', '#ff9492', '#cc959b'],
  vacation: ['#ffe74c', '#ff5964', '#7599e5', '#6bf178', '#35a7ff'],
  oceanSand: ['#ddd8c5', '#cdc392', '#3b556b', '#7599e5', '#adc1e5'],
  brights: ['#6699cc', '#fff275', '#ff8c42', '#ff3c38', '#a23e48'],
  blueRad: ['#006ba6', '#0496ff', '#ffbc42', '#d81159', '#8f2d56'],
};
export default class SchemaExplorer extends React.Component<Props, any> {
  componentDidMount() {
    trackCustomEvent({
      category: 'explorer.view',
      action: 'click',
    });
  }
  constructor(props: Props) {
    super(props);

    const schemaAnalysis = this.props.schemaResults;
    const fieldNames = (schemaAnalysis && Object.keys(schemaAnalysis.fields)) || [];
    const chartHeight = pixelHeightPerField * (fieldNames?.length || 0);

    // console.error('fieldNames', fieldNames)
    const colorPalette = colorSets.blueRad.concat(
      colorSets.brights,
      colorSets.vacation,
      colorSets.oceanSand,
    );
    this.state = !schemaAnalysis
      ? {}
      : {
          chartHeight,
          series: getFieldLabeledData(schemaAnalysis),
          options: {
            colors: colorPalette,
            chart: {
              type: 'bar',
              height: chartHeight,
              stacked: true,
              stackType: '100%',
            },
            plotOptions: {
              bar: {
                horizontal: true,
              },
            },
            stroke: {
              width: 0.5,
              colors: ['#fff'],
              // #cc959b
            },
            title: {
              text: `Field Analysis for ${fieldNames.length} Fields in ${schemaAnalysis.totalRows} Records`,
              style: {
                fontSize: '18px',
                fontWeight: 'bold',
                // fontFamily:  undefined,
                color: '#333333',
              },
            },
            xaxis: {
              categories: getFieldNames(schemaAnalysis), // [2008, 2009, 2010, 2011, 2012, 2013, 2014],
              labels: {
                // @ts-ignore
                formatter: function (value: any, { series, seriesIndex, dataPointIndex, w }) {
                  return value + '';
                },
              },
            },
            yaxis: {
              title: {
                text: undefined,
              },
            },
            tooltip: {
              y: {
                // @ts-ignore
                formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
                  return value + '';
                },
              },
            },
            fill: {
              opacity: 1,
            },
            legend: {
              position: 'top',
              horizontalAlign: 'left',
              offsetX: 25,
            },
            noData: {
              text: 'No analysis data found.',
              align: 'center',
              verticalAlign: 'middle',
              offsetX: 0,
              offsetY: 0,
              style: {
                color: undefined,
                fontSize: '16px',
                fontFamily: undefined,
              },
            },
          },
        };
  }

  render() {
    if (this.state.options) {
      const { chartHeight } = this.state;
      return (
        <Chart
          options={this.state.options}
          series={this.state.series}
          type="bar"
          height={chartHeight}
        />
      );
    } else {
      return <div className="chart-placeholder">Charts waiting for input...</div>;
    }
  }
}
