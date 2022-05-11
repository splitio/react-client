const Enzyme = require('enzyme');
const Adapter = require('@cfaester/enzyme-adapter-react-18').default;
// const Adapter = require('@zarconontol/enzyme-adapter-react-18'); // Using this adapter, tests are failing with TypeError

Enzyme.configure({ adapter: new Adapter() });
