// server/controllers/menuController.js

const MenuItem = require('../models/MenuItem.js');

const menuController = {
  getMenu: async (req, res) => {
    try {
      const { category, isVegetarian, isAvailable } = req.query;
      
      // Build query based on filters
      const query = {};
      if (category) query.category = category;
      if (isVegetarian !== undefined) query.isVegetarian = isVegetarian === 'true';
      if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
      
      const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
      res.json(items);
    } catch (err) {
      console.error('Error fetching menu:', err);
      res.status(500).json({ message: 'Failed to fetch menu' });
    }
  },

  getCategories: async (req, res) => {
    try {
      const categories = await MenuItem.distinct('category');
      res.json(categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  },  addMenuItem: async (req, res) => {
    try {
      let { name, description, price, image, category } = req.body;
      
      // Basic validation
      if (!name?.trim() || !description?.trim() || !category?.trim() || !image?.trim()) {
        return res.status(400).json({ 
          message: 'All fields are required',
          required: ['name', 'description', 'price', 'category', 'image']
        });
      }

      // Parse and validate price
      price = typeof price === 'string' ? parseFloat(price) : price;
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({
          message: 'Price must be a positive number'
        });
      }

      // Validate category
      const validCategories = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        });
      }

      // Create new menu item (let MongoDB handle the _id)
      const newItem = new MenuItem({
        name: name.trim(),
        description: description.trim(),
        price: price,
        image: image.trim(),
        category: category.trim(),
        available: true
      });
      
      // Save the new item
      const savedItem = await newItem.save();
      res.status(201).json(savedItem);
    } catch (err) {
      console.error('Error adding menu item:', err);
      
      // Handle validation errors
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation failed',
          errors: Object.values(err.errors).map(e => e.message)
        });
      }
      
      // Handle other errors
      res.status(500).json({
        message: 'Failed to add menu item',
        error: err.message
      });
    }
  },

  updateMenuItem: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updated = await MenuItem.findByIdAndUpdate(
        id, 
        updates,
        { new: true, runValidators: true }
      );
      
      if (!updated) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json(updated);
    } catch (err) {
      console.error('Error updating menu item:', err);
      res.status(500).json({ message: 'Update failed' });
    }
  },

  toggleAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await MenuItem.findById(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      item.isAvailable = !item.isAvailable;
      await item.save();
      
      res.json(item);
    } catch (err) {
      console.error('Error toggling availability:', err);
      res.status(500).json({ message: 'Failed to update availability' });
    }
  },

  deleteMenuItem: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await MenuItem.findByIdAndDelete(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      console.error('Error deleting menu item:', err);
      res.status(500).json({ message: 'Deletion failed' });
    }
  }
};

module.exports = menuController;
