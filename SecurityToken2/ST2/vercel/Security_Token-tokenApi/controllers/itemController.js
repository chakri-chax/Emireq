// controllers/itemController.js

// In-memory data store (would normally be a database)
let items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ];
  
  // Get all items
  exports.getAllItems = (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve items'
      });
    }
  };
  
  // Get single item by ID
  exports.getItemById = (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = items.find(item => item.id === id);
  
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
  
      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve item'
      });
    }
  };
  
  // Create new item
  exports.createItem = (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(400).json({
          success: false,
          message: 'Item name is required'
        });
      }
  
      const newItem = {
        id: items.length + 1,
        name: req.body.name
      };
  
      items.push(newItem);
  
      res.status(201).json({
        success: true,
        data: newItem,
        message: 'Item created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create item'
      });
    }
  };