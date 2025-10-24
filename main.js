// 配置Tailwind自定义主题
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#165DFF',
        secondary: '#36CFC9',
        accent: '#722ED1',
        neutral: '#F5F7FA',
        dark: '#1D2129'
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  }
}


const apiKey = 'c9335f859e94a0129860b99edb2727cd';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM元素
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherResult = document.getElementById('weatherResult');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

const tempRange = document.getElementById('tempRange');
const airQuality = document.getElementById('airQuality');

// 天气信息元素
const cityName = document.getElementById('cityName');
const currentDate = document.getElementById('currentDate');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weatherCondition');
const weatherIcon = document.getElementById('weatherIcon');
const windInfo = document.getElementById('windInfo');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feelsLike');
const pressure = document.getElementById('pressure');

// 初始化日期显示
updateCurrentDate();

// 事件监听
searchBtn.addEventListener('click', () => fetchWeather());
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') fetchWeather();
});

// 更新当前日期
function updateCurrentDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  currentDate.textContent = now.toLocaleDateString('zh-CN', options);
}

// 获取天气数据
async function fetchWeather() {
  const city = cityInput.value.trim();
  if (!city) {
    showError('请输入城市名称');
    return;
  }
  
  // 显示加载状态
  showLoading();
  
  try {
    // 定义多种搜索格式
    const searchFormats = [];
    
    // 检查是否包含中文
    const hasChinese = /[\u4e00-\u9fa5]/.test(city);
    
    // 添加基本搜索格式
    searchFormats.push(city);
    
    if (hasChinese) {
      // 对于中文城市，添加多种格式尝试
      searchFormats.push(`${city},CN`);        // 城市名+CN
      searchFormats.push(`${city},中国`);     // 城市名+中国
      searchFormats.push(`${city},CHINA`);    // 城市名+CHINA
      
      // 尝试常见的英文翻译（如北京->Beijing）
      const commonTranslations = {
        '北京': 'Beijing',
        '上海': 'Shanghai',
        '广州': 'Guangzhou',
        '深圳': 'Shenzhen',
        '成都': 'Chengdu',
        '杭州': 'Hangzhou',
        '武汉': 'Wuhan',
        '西安': 'Xi\'an',
        '南京': 'Nanjing',
        '重庆': 'Chongqing'
      };
      
      if (commonTranslations[city]) {
        searchFormats.push(commonTranslations[city]);
        searchFormats.push(`${commonTranslations[city]},CN`);
      }
    }
    
    // 依次尝试各种搜索格式
    let weatherData = null;
    let forecastData = null;
    
    for (const searchTerm of searchFormats) {
      // 先获取当前天气数据
      const weatherUrl = `${API_URL}?q=${encodeURIComponent(searchTerm)}&appid=${apiKey}&units=metric&lang=zh_cn`;
      const weatherResponse = await fetch(weatherUrl);
      
      if (weatherResponse.ok) {
        weatherData = await weatherResponse.json();
        // 保存用户输入的原始城市名称
        weatherData.userCityName = city;
        
        // 获取预报数据用于24小时预报
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${apiKey}&units=metric&lang=zh_cn`;
        const forecastResponse = await fetch(forecastUrl);
        if (forecastResponse.ok) {
          forecastData = await forecastResponse.json();
        }
        break;
      } else if (weatherResponse.status !== 404) {
        // 如果不是404错误，可能是API密钥或其他问题
        throw new Error(`API错误: ${weatherResponse.status}`);
      }
    }
    
    // 如果所有格式都尝试失败
    if (!weatherData) {
      throw new Error('未找到该城市，请尝试其他名称或使用英文名称');
    }
    
    displayWeather(weatherData);
    if (forecastData) {
      displayHourlyForecast(forecastData);
      displayDailyForecast(forecastData);
    }
    
  } catch (err) {
    if (err.message.includes('API错误')) {
      if (err.message.includes('401')) {
        showError('API密钥无效，请检查配置');
      } else {
        showError('获取天气数据失败，请稍后再试');
      }
    } else {
      showError(err.message);
    }
  } finally {
    hideLoading();
  }
}

// 显示天气信息
// 显示未来5天天气预报
function displayDailyForecast(forecastData) {
  const dailyForecastContainer = document.getElementById('dailyForecast');
  dailyForecastContainer.innerHTML = '';
  
  // 处理数据，按天分组并计算每天的最高/最低温度
  const dailyData = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' });
    
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = {
        date: dateStr,
        weekday: weekday,
        temps: [item.main.temp],
        icon: item.weather[0].icon,
        description: item.weather[0].description
      };
    } else {
      dailyData[dateStr].temps.push(item.main.temp);
    }
  });
  
  // 获取未来5天的数据（跳过今天）
  const futureDays = Object.values(dailyData).slice(1, 6);
  
  futureDays.forEach(day => {
    // 计算最高和最低温度
    const maxTemp = Math.round(Math.max(...day.temps));
    const minTemp = Math.round(Math.min(...day.temps));
    
    // 创建天气卡片
    const dailyCard = document.createElement('div');
    dailyCard.className = 'weather-card flex flex-col items-center p-4 text-center';
    
    // 设置卡片内容
    dailyCard.innerHTML = `
      <p class="text-gray-600 font-medium mb-1">${day.date}</p>
      <p class="text-gray-500 text-sm mb-2">${day.weekday}</p>
      <img 
        src="https://openweathermap.org/img/wn/${day.icon}@2x.png" 
        alt="${day.description}" 
        class="w-16 h-16 mx-auto mb-3"
      >
      <p class="text-sm text-gray-500 mb-2">${day.description}</p>
      <div class="flex items-center gap-2">
        <span class="text-dark font-bold">${maxTemp}°</span>
        <span class="text-gray-400">|</span>
        <span class="text-gray-500">${minTemp}°</span>
      </div>
    `;
    
    dailyForecastContainer.appendChild(dailyCard);
  });
}

// 显示24小时天气预报
function displayHourlyForecast(forecastData) {
  const hourlyForecastContainer = document.getElementById('hourlyForecast');
  hourlyForecastContainer.innerHTML = '';
  
  // 获取未来24小时的数据（每3小时一个数据点，共8个）
  const hourlyData = forecastData.list.slice(0, 8);
  
  hourlyData.forEach(item => {
    const forecastTime = new Date(item.dt * 1000);
    const hour = forecastTime.getHours();
    const formattedTime = `${hour}:00`;
    
    // 创建天气卡片
    const forecastCard = document.createElement('div');
    forecastCard.className = 'flex-shrink-0 w-24 bg-white rounded-xl p-4 shadow-md text-center';
    
    // 设置卡片内容
    forecastCard.innerHTML = `
      <p class="text-gray-600 font-medium mb-2">${formattedTime}</p>
      <img 
        src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" 
        alt="${item.weather[0].description}" 
        class="w-12 h-12 mx-auto mb-2"
      >
      <p class="text-dark font-bold">${Math.round(item.main.temp)}°C</p>
    `;
    
    hourlyForecastContainer.appendChild(forecastCard);
  });
}

// 显示当前天气信息
function displayWeather(data) {
  const displayCityName = data.userCityName || data.name;
  cityName.textContent = displayCityName;
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  weatherCondition.textContent = data.weather[0].description;
  
  // 设置天气图标
  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIcon.alt = data.weather[0].description;
  
  // 更新温度范围（最低温度和最高温度）
  // 直接使用当前天气数据中的最低最高温度，因为forecast API可能返回不完整数据
  let minTemp = Math.round(data.main.temp_min);
  let maxTemp = Math.round(data.main.temp_max);
  
  // 确保最低温度和最高温度有差异
  if (minTemp === maxTemp) {
    // 如果相同，稍微调整范围
    minTemp -= 2;
    maxTemp += 2;
  }
  
  tempRange.textContent = `${minTemp}°C ~ ${maxTemp}°C`;
  
  // 获取并显示空气质量信息
  fetchAirQuality(data.coord.lat, data.coord.lon);
  
  // 处理风向
  const windDirection = getWindDirection(data.wind.deg);
  windInfo.textContent = `${windDirection} ${Math.round(data.wind.speed)} m/s`;
  
  // 其他信息
  humidity.textContent = `${data.main.humidity}%`;
  feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
  pressure.textContent = `${data.main.pressure} hPa`;
  
  // 显示结果，隐藏错误
  error.classList.add('hidden');
  weatherResult.classList.remove('hidden');
  
  // 添加动画效果
  weatherResult.classList.remove('animate-slide-up');
  void weatherResult.offsetWidth; // 触发重绘
  weatherResult.classList.add('animate-slide-up');
}

// 获取并显示空气质量信息
async function fetchAirQuality(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch air quality data');
    }
    
    const data = await response.json();
    const aqi = data.list[0].main.aqi;
    
    // AQI等级: 1-优, 2-良, 3-中等, 4-差, 5-非常差
    const aqiLevels = ['优', '良', '中等', '差', '非常差'];
    const aqiText = aqi <= 5 ? aqiLevels[aqi - 1] : '未知';
    
    airQuality.textContent = `空气质量: ${aqiText}`;
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    airQuality.textContent = '空气质量: 暂无数据';
  }
}

// 将风向角度转换为方向文字
function getWindDirection(deg) {
  const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  return directions[Math.round(deg / 45) % 8];
}

// 显示加载状态
function showLoading() {
  loading.classList.remove('hidden');
  weatherResult.classList.add('hidden');
  error.classList.add('hidden');
}

// 隐藏加载状态
function hideLoading() {
  loading.classList.add('hidden');
}

// 显示错误信息
function showError(message) {
  errorMessage.textContent = message;
  error.classList.remove('hidden');
  weatherResult.classList.add('hidden');
}

// 初始加载示例城市天气（可选）
// window.addEventListener('load', () => {
//   cityInput.value = '北京';
//   fetchWeather();
// });