module.exports = {
  port: process.env.PORT || 8081,
  directory: 'src/mobile',
  spa: true,
  staticMaxage: 0,
  cors: true,
  compress: true,
  mocks: {
    '/manifest.json': (req, res) => {
      res.sendFile(process.cwd() + '/public/manifest.json');
    },
    '/icons/*': (req, res) => {
      res.sendFile(process.cwd() + '/public' + req.path);
    },
    '/screenshots/*': (req, res) => {
      res.sendFile(process.cwd() + '/public' + req.path);
    }
  }
}; 