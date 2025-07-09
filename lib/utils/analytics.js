// Analytics utility functions for processing data
export const processRevenueData = (invoices) => {
  const monthlyRevenue = {};
  
  invoices.forEach(invoice => {
    const month = invoice.created_at.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + invoice.total;
  });
  
  return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue)
  })).slice(-6); // Last 6 months
};

export const processJobCardStatusData = (jobCards) => {
  const statusCount = {};
  
  jobCards.forEach(jobCard => {
    statusCount[jobCard.status] = (statusCount[jobCard.status] || 0) + 1;
  });
  
  return Object.entries(statusCount).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  }));
};

export const processInventoryData = (products) => {
  const categoryData = {};
  
  products.forEach(product => {
    const category = product.category;
    if (!categoryData[category]) {
      categoryData[category] = { quantity: 0, value: 0 };
    }
    categoryData[category].quantity += product.quantity;
    categoryData[category].value += product.quantity * product.unit_price;
  });
  
  return Object.entries(categoryData).map(([category, data]) => ({
    category,
    quantity: data.quantity,
    value: Math.round(data.value)
  }));
};

export const processTopProductsData = (products) => {
  return products
    .map(product => ({
      name: product.name,
      value: product.quantity * product.unit_price,
      quantity: product.quantity
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export const processWeeklyJobCards = (jobCards) => {
  const weeklyData = {};
  const today = new Date();
  
  // Generate last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    weeklyData[dayName] = 0;
  }
  
  jobCards.forEach(jobCard => {
    const dayName = jobCard.created_at.toLocaleDateString('en-US', { weekday: 'short' });
    if (weeklyData.hasOwnProperty(dayName)) {
      weeklyData[dayName]++;
    }
  });
  
  return Object.entries(weeklyData).map(([day, count]) => ({
    day,
    count
  }));
};

export const calculateGrowthRate = (currentData, previousData) => {
  if (previousData === 0) return currentData > 0 ? 100 : 0;
  return ((currentData - previousData) / previousData * 100).toFixed(1);
};

export const getTopCustomers = (jobCards) => {
  const customerData = {};
  
  jobCards.forEach(jobCard => {
    const customer = jobCard.customer_name;
    customerData[customer] = (customerData[customer] || 0) + 1;
  });
  
  return Object.entries(customerData)
    .map(([name, visits]) => ({ name, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);
};