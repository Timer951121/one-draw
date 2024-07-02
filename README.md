# OneDraw

This is a Web Application built using React.js for Trinity Solar.

## Features

- **User Authentication**: Secure login with Azure MSAL. (https://learn.microsoft.com/en-us/javascript/api/overview/msal-overview?view=msal-js-latest)
- **State Management**: Uses Zustand for global state management  (https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Routing**: Implements React Router v6 for navigation. (https://reactrouter.com/en/main)
- **3D Rendering**: Utilizes Three.js for 3D rendering capabilities. (https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene)
- **Interactive Maps**: Integrated with Google Maps for location-based functionalities. (https://developers.google.com/maps/documentation/javascript/examples/elevation-simple , https://help.nearmap.com/kb/articles/65-nearmap-apis , https://docs.mapbox.com/api/maps/static-images/)
- **Rich UI Components**: Utilizes Ant Design for a clean and responsive UI. (https://ant.design/components/menu)
- **Data Visualization**: Features charts and graphs using ApexCharts. (https://apexcharts.com/docs/react-charts/)
- **File Handling**: Supports file operations with libraries like jsPDF and JSZip. (https://raw.githack.com/MrRio/jsPDF/master/docs/index.html)
- **Heatmaps**: Advanced heatmap capabilities with heatmap.js. (https://www.patrick-wied.at/static/heatmapjs/)
- **Image Processing**: Convert HTML to images with html-to-image.

## Installation

To get started with OneDraw, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/trinity-development/OneDraw.git
   cd onedraw
   ```


2. Install the dependencies:
   ```sh
   npm install
   ```

## Scripts

The project comes with several npm scripts for common tasks:

- **Start the development server**:
  ```sh
  npm run start
  ```

- **Start the UAT server**:
  ```sh
  npm run start:uat
  ```

- **Start the pre-production server**:
  ```sh
  npm run start:preprod
  ```

- **Start the production server**:
  ```sh
  npm run start:prod
  ```

- **Build the project for development**:
  ```sh
  npm run build
  ```

- **Build the project for UAT**:
  ```sh
  npm run build:uat
  ```

- **Build the project for pre-production**:
  ```sh
  npm run build:preprod
  ```

- **Build the project for production**:
  ```sh
  npm run build:prod
  ```

**Pre Requisite :**

* **Node.js** LTS for Runtime Environment
* **npm** to install packages


OneDraw uses a variety of dependencies to deliver its functionality:

- **Core Libraries**:
    - \`react\`
    - \`react-dom\`
    - \`react-router-dom\`
    - \`axios\`
    - \`three\`
    - \`zustand\`

- **UI/UX**:
    - \`antd\`
    - \`styled-components\`
    - \`react-custom-scrollbars-2\`
    - \`react-circular-progressbar\`

- **Data Handling**:
    - \`dayjs\`
    - \`papaparse\`
    - \`html-to-image\`

- **Visualization**:
    - \`apexcharts\`
    - \`react-apexcharts\`
    - \`heatmap.js\`

- **Miscellaneous**:
    - \`buffer\`
    - \`env-cmd\`
    - \`pino\`

For a full list of dependencies, refer to the \`package.json\` file.

Note : 
* All API URLS & Keys are stored in .env-cmdrc file.
* azure-pipelines.yml is used for CI/CD.
