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

// 常用城市数据库
const popularCities = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '西安', '南京', '重庆',
  '苏州', '天津', '长沙', '郑州', '东莞', '青岛', '沈阳', '宁波', '昆明', '福州',
  '无锡', '厦门', '济南', '大连', '哈尔滨', '合肥', '佛山', '南宁', '贵阳', '南昌',
  '长春', '温州', '石家庄', '泉州', '金华', '常州', '南通', '嘉兴', '太原', '徐州',
  '珠海', '中山', '惠州', '南阳', '金华', '盐城', '扬州', '南宁', '贵阳', '南昌',
  '长春', '温州', '石家庄', '泉州', '金华', '常州', '南通', '嘉兴', '太原', '徐州',
  'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xi\'an', 'Nanjing', 'Chongqing',
  'New York', 'London', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 'Los Angeles', 'Chicago', 'Toronto', 'Singapore'
];

const apiKey = 'c9335f859e94a0129860b99edb2727cd';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM元素
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherResult = document.getElementById('weatherResult');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const citySuggestions = document.getElementById('citySuggestions');

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

// 城市自动完成功能
cityInput.addEventListener('input', handleCityInput);
cityInput.addEventListener('focus', handleCityInput);

// 点击页面其他地方关闭建议列表
document.addEventListener('click', (e) => {
  if (!cityInput.contains(e.target) && !citySuggestions.contains(e.target)) {
    citySuggestions.classList.add('hidden');
  }
});

// 处理城市输入
function handleCityInput() {
  const input = cityInput.value.trim().toLowerCase();
  
  if (input.length === 0) {
    citySuggestions.classList.add('hidden');
    return;
  }
  
  // 筛选匹配的城市
  const filteredCities = popularCities.filter(city => 
    city.toLowerCase().includes(input)
  ).slice(0, 10); // 最多显示10个建议
  
  if (filteredCities.length > 0) {
    displayCitySuggestions(filteredCities);
  } else {
    citySuggestions.classList.add('hidden');
  }
}

// 显示城市建议
function displayCitySuggestions(cities) {
  citySuggestions.innerHTML = '';
  
  cities.forEach(city => {
    const suggestion = document.createElement('div');
    suggestion.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors';
    suggestion.textContent = city;
    
    // 点击建议项时选择城市
    suggestion.addEventListener('click', () => {
      cityInput.value = city;
      citySuggestions.classList.add('hidden');
      fetchWeather();
    });
    
    citySuggestions.appendChild(suggestion);
  });
  
  citySuggestions.classList.remove('hidden');
}

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
    displayLifeAdvice(weatherData);
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

// 生成并显示生活建议
function displayLifeAdvice(weatherData) {
  const lifeAdviceContainer = document.getElementById('lifeAdvice');
  lifeAdviceContainer.innerHTML = '';
  
  const { main, weather, wind, coord } = weatherData;
  const temp = main.temp;
  const humidity = main.humidity;
  const weatherMain = weather[0].main;
  const weatherDescription = weather[0].description;
  const windSpeed = wind.speed;
  
  // 穿衣建议
  const clothingAdvice = generateClothingAdvice(temp, weatherMain);
  createAdviceCard(lifeAdviceContainer, '穿衣建议', clothingAdvice.icon, clothingAdvice.text);
  
  // 出行建议
  const travelAdvice = generateTravelAdvice(weatherMain, windSpeed, weatherDescription);
  createAdviceCard(lifeAdviceContainer, '出行建议', travelAdvice.icon, travelAdvice.text);
  
  // 运动建议
  const sportAdvice = generateSportAdvice(temp, weatherMain, humidity);
  createAdviceCard(lifeAdviceContainer, '运动建议', sportAdvice.icon, sportAdvice.text);
  
  // 防晒建议
  const sunscreenAdvice = generateSunscreenAdvice(weatherMain, weatherDescription);
  createAdviceCard(lifeAdviceContainer, '防晒建议', sunscreenAdvice.icon, sunscreenAdvice.text);
  
  // 健康建议
  const healthAdvice = generateHealthAdvice(humidity, weatherMain);
  createAdviceCard(lifeAdviceContainer, '健康建议', healthAdvice.icon, healthAdvice.text);
}

// 创建建议卡片
function createAdviceCard(container, title, icon, text) {
  const card = document.createElement('div');
  card.className = 'weather-card p-5';
  
  card.innerHTML = `
    <div class="flex items-start gap-4">
      <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary flex-shrink-0">
        <i class="fa ${icon} text-xl"></i>
      </div>
      <div>
        <h4 class="font-bold text-dark mb-2">${title}</h4>
        <p class="text-gray-600 text-sm">${text}</p>
      </div>
    </div>
  `;
  
  container.appendChild(card);
}

// 生成穿衣建议
function generateClothingAdvice(temp, weatherMain) {
  let icon = 'fa-user';
  let text = '';
  
  if (temp < 0) {
    text = '天气寒冷，建议穿着羽绒服、厚毛衣、围巾等保暖衣物。';
    icon = 'fa-snowflake-o';
  } else if (temp < 10) {
    text = '天气较冷，建议穿着毛衣、外套、风衣等保暖衣物。';
    icon = 'fa-user';
  } else if (temp < 20) {
    text = '天气凉爽，建议穿着长袖衬衫、薄毛衣等春秋装。';
    icon = 'fa-user';
  } else if (temp < 26) {
    text = '天气舒适，建议穿着短袖、薄长裤等夏装。';
    icon = 'fa-user';
  } else if (temp < 32) {
    text = '天气炎热，建议穿着短袖、短裤等清凉夏装。';
    icon = 'fa-user';
  } else {
    text = '天气酷热，建议穿着轻薄、透气的衣物，注意防晒降温。';
    icon = 'fa-user';
  }
  
  // 根据天气状况调整建议
  if (weatherMain === 'Rain') {
    text += ' 另外，记得携带雨具。';
  } else if (weatherMain === 'Snow') {
    text += ' 注意防滑保暖。';
  } else if (weatherMain === 'Thunderstorm') {
    text += ' 雷雨天气，注意安全，避免外出。';
  }
  
  return { icon, text };
}

// 生成出行建议
function generateTravelAdvice(weatherMain, windSpeed, weatherDescription) {
  let icon = 'fa-car';
  let text = '';
  
  switch (weatherMain) {
    case 'Clear':
      text = '天气晴朗，适合外出旅行观光。';
      icon = 'fa-car';
      break;
    case 'Clouds':
      if (weatherDescription.includes('少云') || weatherDescription.includes('晴间多云')) {
        text = '天气较好，适合外出，注意防晒。';
        icon = 'fa-car';
      } else {
        text = '天气阴沉，适合进行室内活动。';
        icon = 'fa-home';
      }
      break;
    case 'Rain':
      text = '有雨，外出记得携带雨具，道路湿滑注意安全。';
      icon = 'fa-umbrella';
      break;
    case 'Snow':
      text = '有雪，道路可能结冰，出行请注意安全，建议减少不必要外出。';
      icon = 'fa-snowflake-o';
      break;
    case 'Thunderstorm':
      text = '雷雨天气，不建议外出，如必须外出注意防雷。';
      icon = 'fa-bolt';
      break;
    case 'Fog':
    case 'Mist':
      text = '能见度低，驾车请开启雾灯，减速慢行，注意安全。';
      icon = 'fa-car';
      break;
    default:
      text = '天气一般，外出请注意天气变化。';
      icon = 'fa-car';
  }
  
  // 考虑风速影响
  if (windSpeed > 10) {
    text += ' 风力较大，注意防风。';
  }
  
  return { icon, text };
}

// 生成运动建议
function generateSportAdvice(temp, weatherMain, humidity) {
  let icon = 'fa-futbol-o';
  let text = '';
  
  // 温度适宜性
  const tempComfortable = temp >= 10 && temp <= 28;
  // 湿度适宜性
  const humidityComfortable = humidity >= 30 && humidity <= 70;
  // 天气适宜性
  const weatherSuitable = weatherMain === 'Clear' || weatherMain === 'Clouds';
  
  if (weatherSuitable && tempComfortable && humidityComfortable) {
    text = '天气条件非常适合户外运动，尽情享受运动乐趣吧！';
    icon = 'fa-futbol-o';
  } else if (weatherMain === 'Rain' || weatherMain === 'Snow' || weatherMain === 'Thunderstorm') {
    text = '天气不佳，建议进行室内运动，如瑜伽、健身操等。';
    icon = 'fa-home';
  } else if (temp > 32) {
    text = '天气炎热，避免在中午高温时段运动，建议清晨或傍晚进行，注意补水。';
    icon = 'fa-tint';
  } else if (temp < 5) {
    text = '天气寒冷，户外运动前需充分热身，注意保暖，避免长时间户外剧烈运动。';
    icon = 'fa-snowflake-o';
  } else if (humidity > 80) {
    text = '湿度较大，运动时注意防暑降温，及时补充水分和电解质。';
    icon = 'fa-tint';
  } else {
    text = '天气条件一般，可适当进行户外运动，注意身体感受，及时调整运动强度。';
    icon = 'fa-futbol-o';
  }
  
  return { icon, text };
}

// 生成防晒建议
function generateSunscreenAdvice(weatherMain, weatherDescription) {
  let icon = 'fa-umbrella';
  let text = '';
  
  switch (weatherMain) {
    case 'Clear':
      text = '紫外线强烈，外出请做好防晒措施，涂抹SPF30以上防晒霜，戴帽子和太阳镜。';
      icon = 'fa-umbrella';
      break;
    case 'Clouds':
      if (weatherDescription.includes('少云') || weatherDescription.includes('晴间多云')) {
        text = '紫外线仍然较强，建议涂抹防晒霜，避免长时间阳光直射。';
        icon = 'fa-umbrella';
      } else {
        text = '紫外线较弱，但长时间户外活动仍建议涂抹防晒霜。';
        icon = 'fa-umbrella';
      }
      break;
    case 'Rain':
    case 'Thunderstorm':
      text = '紫外线较弱，无需特别防晒措施，但记得带伞。';
      icon = 'fa-umbrella';
      break;
    case 'Snow':
      text = '雪地反射阳光，紫外线仍然较强，建议涂抹防晒霜，保护皮肤和眼睛。';
      icon = 'fa-umbrella';
      break;
    default:
      text = '根据天气情况适当防护，长时间户外活动建议涂抹防晒霜。';
      icon = 'fa-umbrella';
  }
  
  return { icon, text };
}

// 生成健康建议
function generateHealthAdvice(humidity, weatherMain) {
  let icon = 'fa-heartbeat';
  let text = '';
  
  // 湿度健康建议
  if (humidity < 30) {
    text = '空气干燥，注意多喝水，使用加湿器，预防呼吸道不适。';
    icon = 'fa-heartbeat';
  } else if (humidity > 80) {
    text = '空气潮湿，注意防潮除湿，保持室内通风，预防霉菌滋生。';
    icon = 'fa-heartbeat';
  } else {
    text = '湿度适宜，对健康较为有利，保持良好作息。';
    icon = 'fa-heartbeat';
  }
  
  // 天气相关健康建议
  if (weatherMain === 'Rain' || weatherMain === 'Snow') {
    text += ' 天气转凉，注意保暖，预防感冒。';
  } else if (weatherMain === 'Clear' && humidity < 40) {
    text += ' 气候干燥，注意护肤和补水。';
  } else if (weatherMain === 'Thunderstorm') {
    text += ' 雷雨天气，注意调节情绪，保持室内空气流通。';
  }
  
  return { icon, text };
}

// 根据天气状况和时间更新页面背景
function updateWeatherBackground(weatherMain, iconCode) {
  console.log('开始更新天气背景', { weatherMain, iconCode });
  const body = document.body;
  
  // 清除旧的动画元素
  cleanupOldAnimations();
  console.log('旧动画已清理');
  
  // 检查是否是夜晚 (图标代码以n结尾)
  const isNight = iconCode.endsWith('n');
  console.log('是否是夜晚模式:', isNight);
  
  // 添加过渡效果类
  body.style.transition = 'background-color 0.8s ease, color 0.8s ease';
  
  // 根据天气状况设置不同的背景
  switch (weatherMain) {
    case 'Clear':
      console.log('天气状况: Clear (晴朗)');
      if (isNight) {
        // 晴朗夜晚 - 深蓝色调，带有星星
        setBackground('from-blue-900', 'to-indigo-950', '#e0e0e0');
        addStarsAnimation();
      } else {
        // 晴朗白天 - 明亮蓝色调，带有太阳
        setBackground('from-blue-400', 'to-blue-100', '#1D2129');
        addSunAnimation();
      }
      break;
    
    case 'Clouds':
      console.log('天气状况: Clouds (多云)');
      if (isNight) {
        // 多云夜晚 - 深蓝色调混合灰色
        setBackground('from-slate-900', 'to-blue-900', '#e0e0e0');
      } else {
        // 多云白天 - 浅蓝色调混合灰色
        setBackground('from-sky-200', 'to-gray-200', '#1D2129');
        addCloudsAnimation();
      }
      break;
    
    case 'Rain':
      console.log('天气状况: Rain (下雨)');
      // 雨天 - 深蓝色调，带有雨滴动画
      setBackground('from-slate-800', 'to-slate-900', '#e0e0e0');
      addRainAnimation();
      break;
    
    case 'Drizzle':
      console.log('天气状况: Drizzle (毛毛雨)');
      // 毛毛雨 - 灰色调，更柔和
      setBackground('from-slate-700', 'to-slate-800', '#e0e0e0');
      addDrizzleAnimation();
      break;
    
    case 'Thunderstorm':
      console.log('天气状况: Thunderstorm (雷暴)');
      // 雷暴 - 深紫色调，带有闪电效果
      setBackground('from-violet-900', 'to-slate-900', '#e0e0e0');
      addThunderAnimation();
      break;
    
    case 'Snow':
      console.log('天气状况: Snow (下雪)');
      if (isNight) {
        // 雪夜 - 深灰色调带有淡蓝色
        setBackground('from-slate-800', 'to-blue-800', '#e0e0e0');
      } else {
        // 雪天 - 明亮的浅色调
        setBackground('from-blue-100', 'to-gray-100', '#1D2129');
      }
      addSnowAnimation();
      break;
    
    case 'Mist':
    case 'Fog':
    case 'Haze':
      console.log('天气状况:', weatherMain, '(雾/霾)');
      if (isNight) {
        // 夜晚雾气 - 深灰色调
        setBackground('from-slate-800', 'to-slate-700', '#e0e0e0');
      } else {
        // 白天雾气 - 柔和灰色调
        setBackground('from-gray-300', 'to-gray-200', '#1D2129');
      }
      addFogAnimation();
      break;
    
    default:
      console.log('天气状况: 默认');
      // 默认背景 - 柔和蓝紫色调
      setBackground('from-blue-50', 'to-indigo-100', '#1D2129');
  }
  
  console.log('天气背景更新完成');
  
  // 辅助函数：设置背景和文字颜色
  function setBackground(fromColor, toColor, textColor) {
    // 清除所有现有的背景渐变类
    body.className = body.className.replace(/bg-gradient-to-br\s+from-\w+-\d+\s+to-\w+-\d+/g, '');
    // 添加新的背景渐变类
    body.classList.add('bg-gradient-to-br', fromColor, toColor);
    // 设置文字颜色
    body.style.color = textColor;
    console.log('已设置背景:', { fromColor, toColor, textColor });
  }
}

// 清理旧的动画元素
function cleanupOldAnimations() {
  // 移除星星
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => star.remove());
  
  // 移除雪花
  const snowflakes = document.querySelectorAll('.snowflake');
  snowflakes.forEach(snowflake => snowflake.remove());
  
  // 移除太阳元素
  const sunElements = document.querySelectorAll('.sun-element');
  sunElements.forEach(sun => sun.remove());
  
  // 移除云朵元素
  const clouds = document.querySelectorAll('.cloud');
  clouds.forEach(cloud => cloud.remove());
  
  // 移除雨滴元素
  const raindrops = document.querySelectorAll('.raindrop');
  raindrops.forEach(rain => rain.remove());
  
  // 移除毛毛雨元素
  const drizzles = document.querySelectorAll('.drizzle');
  drizzles.forEach(drizzle => drizzle.remove());
  
  // 移除雷电元素
  const thunders = document.querySelectorAll('.thunder');
  thunders.forEach(thunder => thunder.remove());
  
  // 移除雾气元素
  const fogLayers = document.querySelectorAll('.fog-layer');
  fogLayers.forEach(fog => fog.remove());
  
  // 移除旧的样式元素
  const oldStyles = document.querySelectorAll('style[data-weather-animation]');
  oldStyles.forEach(style => style.remove());
}

// 创建并添加样式元素的辅助函数
function createStyleElement(content) {
  const style = document.createElement('style');
  style.setAttribute('data-weather-animation', 'true');
  style.textContent = content;
  document.head.appendChild(style);
  return style;
}

// 动画效果测试函数
function testAnimations() {
  console.log('测试动画效果');
  // 清理旧动画
  cleanupOldAnimations();
  // 测试添加一个动画看看是否工作
  const testStyle = createStyleElement(`
    @keyframes testAnimation {
      0% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.5); opacity: 1; }
      100% { transform: scale(1); opacity: 0.5; }
    }
    .test-animation {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 100px;
      height: 100px;
      background-color: rgba(255, 0, 0, 0.3);
      border-radius: 50%;
      z-index: 1000;
      animation: testAnimation 2s infinite ease-in-out;
    }
  `);
  
  const testElement = document.createElement('div');
  testElement.className = 'test-animation';
  document.body.appendChild(testElement);
  
  // 3秒后移除测试动画
  setTimeout(() => {
    testElement.remove();
    testStyle.remove();
    console.log('测试动画已移除');
  }, 3000);
}

// 添加太阳动画效果
function addSunAnimation() {
  console.log('添加太阳动画效果');
  
  // 首先检查是否已存在太阳元素
  const existingSun = document.querySelector('.sun-element');
  if (existingSun) {
    existingSun.remove();
  }
  
  createStyleElement(`
    @keyframes sunGlow {
      0% { 
        transform: scale(1); 
        box-shadow: 0 0 150px 80px rgba(255, 215, 0, 0.6); 
        opacity: 0.8;
      }
      50% { 
        transform: scale(1.05); 
        box-shadow: 0 0 180px 100px rgba(255, 215, 0, 0.7); 
        opacity: 0.9;
      }
      100% { 
        transform: scale(1); 
        box-shadow: 0 0 150px 80px rgba(255, 215, 0, 0.6); 
        opacity: 0.8;
      }
    }
    .sun-element {
      position: fixed;
      top: -10%;
      right: -10%;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      filter: blur(10px);
      animation: sunGlow 8s infinite ease-in-out;
      z-index: -1;
      pointer-events: none;
    }
  `);
  
  // 创建太阳元素
  const sun = document.createElement('div');
  sun.className = 'sun-element';
  document.body.appendChild(sun);
  console.log('太阳元素已添加到DOM');
}

// 添加星星动画效果
function addStarsAnimation() {
  console.log('添加星星动画效果');
  
  // 添加星星样式
  createStyleElement(`
    @keyframes twinkle {
      0%, 100% { 
        opacity: 0.2; 
        transform: scale(0.9);
        box-shadow: 0 0 3px 1px rgba(255, 255, 255, 0.3);
      }
      50% { 
        opacity: 1; 
        transform: scale(1.1);
        box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.8);
      }
    }
    .star {
      position: fixed;
      background-color: #ffffff;
      border-radius: 50%;
      z-index: -1;
      pointer-events: none;
      /* 确保星星覆盖整个屏幕 */
      top: 0;
      left: 0;
      margin: 0;
    }
  `);
  
  // 创建星星
  let starCount = 0;
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    
    // 随机大小和亮度
    const size = Math.random() * 3 + 1;
    star.style.width = `${size}px`;
    star.style.height = star.style.width;
    star.style.opacity = Math.random() * 0.8 + 0.2;
    
    // 随机闪烁动画
    const duration = Math.random() * 3 + 2;
    const delay = Math.random() * 5;
    star.style.animation = `twinkle ${duration}s infinite ease-in-out ${delay}s`;
    
    // 添加光晕效果
    star.style.boxShadow = `0 0 ${size * 2}px ${size / 2}px rgba(255, 255, 255, 0.5)`;
    
    document.body.appendChild(star);
    starCount++;
  }
  console.log(`已添加 ${starCount} 颗星星到DOM`);
}

// 添加云朵动画效果
function addCloudsAnimation() {
  console.log('添加云朵动画效果');
  
  createStyleElement(`
    .cloud {
      position: fixed;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      filter: blur(15px);
      z-index: -1;
      pointer-events: none;
      /* 确保云朵覆盖更大区域 */
      width: 300px;
      height: 150px;
    }
    .cloud-part {
      position: absolute;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
    }
    @keyframes cloudMove {
      0% { transform: translateX(-150%) translateY(0); opacity: 0.7; }
      50% { transform: translateX(75vw) translateY(-20px); opacity: 0.9; }
      100% { transform: translateX(calc(100vw + 500px)) translateY(0); opacity: 0.6; }
    }
  `);
  
  // 创建云朵
  let cloudCount = 0;
  for (let i = 0; i < 3; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    
    // 主云朵
    const mainWidth = 200 + i * 50;
    const mainHeight = 100 + i * 20;
    cloud.style.width = `${mainWidth}px`;
    cloud.style.height = `${mainHeight}px`;
    cloud.style.top = `${10 + i * 15}%`;
    cloud.style.left = `${-200 - i * 100}%`;
    cloud.style.animation = `cloudMove ${25 + i * 10}s linear ${i * 3}s infinite`;
    
    // 创建云朵的多个部分
    const parts = 5;
    for (let j = 0; j < parts; j++) {
      const part = document.createElement('div');
      part.className = 'cloud-part';
      part.style.width = `${60 + j * 20}px`;
      part.style.height = `${50 + j * 10}px`;
      part.style.top = `${-20 - j * 5}%`;
      part.style.left = `${15 + j * 18}%`;
      cloud.appendChild(part);
    }
    
    document.body.appendChild(cloud);
    cloudCount++;
  }
  console.log(`已添加 ${cloudCount} 朵云到DOM`);
}

// 添加下雨动画效果
function addRainAnimation() {
  console.log('添加下雨动画效果');
  
  createStyleElement(`
    @keyframes rainFall {
      0% { transform: translateY(-50px) rotate(15deg); opacity: 0; }
      50% { opacity: 0.8; }
      100% { transform: translateY(200vh) rotate(15deg); opacity: 0.6; }
    }
    .raindrop {
      position: fixed;
      width: 0.5px;
      height: 5px;
      background: rgba(137, 207, 240, 0.8);
      border-radius: 0 0 50% 50%;
      box-shadow: 0 0 5px 1px rgba(137, 207, 240, 0.3);
      z-index: -1;
      pointer-events: none;
      /* 确保雨滴覆盖整个屏幕宽度 */
      left: 0;
      right: 0;
    }
  `);
  
  // 创建雨滴
  let rainCount = 0;
  for (let i = 0; i < 150; i++) {
    const raindrop = document.createElement('div');
    raindrop.className = 'raindrop';
    
    // 随机位置和动画
    const left = Math.random() * 100;
    const top = Math.random() * 200 - 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 2 + 0.5;
    const width = Math.random() * 0.3 + 0.2;
    const height = Math.random() * 10 + 5;
    
    raindrop.style.left = `${left}%`;
    raindrop.style.top = `${top}%`;
    raindrop.style.width = `${width}px`;
    raindrop.style.height = `${height}px`;
    raindrop.style.animation = `rainFall ${duration}s linear ${delay}s infinite`;
    
    document.body.appendChild(raindrop);
    rainCount++;
  }
  console.log(`已添加 ${rainCount} 滴雨到DOM`);
}

// 添加毛毛雨动画效果
function addDrizzleAnimation() {
  console.log('添加毛毛雨动画效果');
  
  createStyleElement(`
    @keyframes drizzleFall {
      0% { transform: translateY(-50px) rotate(8deg); opacity: 0; }
      40% { opacity: 0.6; }
      100% { transform: translateY(200vh) rotate(8deg); opacity: 0.4; }
    }
    .drizzle {
      position: fixed;
      width: 0.5px;
      height: 3px;
      background: rgba(173, 216, 230, 0.6);
      border-radius: 0 0 50% 50%;
      z-index: -1;
      pointer-events: none;
      /* 确保毛毛雨覆盖整个屏幕宽度 */
      left: 0;
      right: 0;
    }
  `);
  
  // 创建毛毛雨
  let drizzleCount = 0;
  for (let i = 0; i < 100; i++) {
    const drizzle = document.createElement('div');
    drizzle.className = 'drizzle';
    
    // 随机位置和动画
    const left = Math.random() * 100;
    const top = Math.random() * 200 - 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 3 + 1;
    const width = Math.random() * 0.3 + 0.2;
    const height = Math.random() * 5 + 3;
    
    drizzle.style.left = `${left}%`;
    drizzle.style.top = `${top}%`;
    drizzle.style.width = `${width}px`;
    drizzle.style.height = `${height}px`;
    drizzle.style.animation = `drizzleFall ${duration}s linear ${delay}s infinite`;
    
    document.body.appendChild(drizzle);
    drizzleCount++;
  }
  console.log(`已添加 ${drizzleCount} 滴毛毛雨到DOM`);
}

// 添加雷电动画效果
function addThunderAnimation() {
  console.log('添加雷电动画效果');
  
  // 先添加雨滴
  addRainAnimation();
  
  createStyleElement(`
    @keyframes thunderFlash {
      0%, 96%, 97%, 99%, 100% { opacity: 0; }
      98% { opacity: 0.6; }
      98.5% { opacity: 0.3; }
      99.5% { opacity: 0.4; }
    }
    .thunder {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 255, 255, 0.5);
      z-index: -1;
      pointer-events: none;
      /* 确保雷电效果覆盖整个屏幕 */
      margin: 0;
      padding: 0;
    }
  `);
  
  // 移除可能存在的旧雷电效果
  const existingThunder = document.querySelector('.thunder');
  if (existingThunder) {
    existingThunder.remove();
  }
  
  const thunder = document.createElement('div');
  thunder.className = 'thunder';
  thunder.style.animation = 'thunderFlash 5s ease-in-out infinite';
  
  document.body.appendChild(thunder);
  console.log('雷电效果已添加到DOM');
}

// 添加下雪动画效果
function addSnowAnimation() {
  console.log('添加下雪动画效果');
  
  createStyleElement(`
    @keyframes snowFall {
      0% { 
        transform: translateY(-50px) translateX(0) rotate(0deg); 
        opacity: 0; 
      }
      25% { 
        transform: translateY(50vh) translateX(20px) rotate(90deg); 
        opacity: 0.8; 
      }
      50% { 
        transform: translateY(100vh) translateX(-20px) rotate(180deg); 
        opacity: 0.9; 
      }
      75% { 
        transform: translateY(150vh) translateX(10px) rotate(270deg); 
        opacity: 0.7; 
      }
      100% { 
        transform: translateY(200vh) translateX(0) rotate(360deg); 
        opacity: 0; 
      }
    }
    .snowflake {
      position: fixed;
      font-size: 12px;
      text-align: center;
      z-index: -1;
      pointer-events: none;
      /* 确保雪花覆盖整个屏幕宽度 */
      left: 0;
      right: 0;
    }
  `);
  
  // 创建雪花
  const isNightMode = document.body.classList.contains('from-slate-800');
  let snowflakeCount = 0;
  for (let i = 0; i < 60; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    
    // 随机大小和位置
    const size = Math.random() * 8 + 6;
    const left = Math.random() * 100;
    const top = Math.random() * 200 - 100;
    const delay = Math.random() * 10;
    const duration = Math.random() * 10 + 7;
    
    // 设置雪花样式 - 夜晚使用更亮的雪花
    snowflake.innerHTML = '❄️';
    snowflake.style.fontSize = `${size}px`;
    snowflake.style.left = `${left}%`;
    snowflake.style.top = `${top}%`;
    snowflake.style.animation = `snowFall ${duration}s ease-in-out ${delay}s infinite`;
    
    // 根据背景调整雪花亮度
    const opacity = Math.random() * 0.8 + 0.2;
    snowflake.style.opacity = isNightMode ? opacity * 1.2 : opacity;
    
    // 夜晚添加光晕效果
    if (isNightMode) {
      snowflake.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.8)';
    }
    
    document.body.appendChild(snowflake);
    snowflakeCount++;
  }
  console.log(`已添加 ${snowflakeCount} 片雪花到DOM`);
}

// 添加雾气动画效果
function addFogAnimation() {
  console.log('添加雾气动画效果');
  
  createStyleElement(`
    @keyframes fogMove {
      0% { transform: translateX(-30%) scale(1.2); opacity: 0.2; }
      50% { transform: translateX(30%) scale(1.3); opacity: 0.3; }
      100% { transform: translateX(-30%) scale(1.2); opacity: 0.2; }
    }
    .fog-layer {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      filter: blur(25px);
      pointer-events: none;
      /* 确保雾气覆盖整个屏幕 */
      margin: 0;
      padding: 0;
    }
  `);
  
  // 创建多层雾气
  let fogCount = 0;
  for (let i = 0; i < 3; i++) {
    const fog = document.createElement('div');
    fog.className = 'fog-layer';
    
    // 根据当前背景调整雾气颜色
    const isDarkBackground = document.body.classList.contains('from-slate-800') || 
                           document.body.classList.contains('from-slate-700');
    fog.style.backgroundColor = isDarkBackground ? 'rgba(50, 50, 70, 0.3)' : 'rgba(255, 255, 255, 0.2)';
    fog.style.opacity = `${0.25 - i * 0.05}`;
    fog.style.animation = `fogMove ${20 + i * 5}s ease-in-out ${i * 2}s infinite`;
    
    document.body.appendChild(fog);
    fogCount++;
  }
  console.log(`已添加 ${fogCount} 层雾气到DOM`);
}

// 显示当前天气信息
function displayWeather(data) {
  // 获取天气信息
  const weatherMain = data.weather[0].main;
  const iconCode = data.weather[0].icon;
  
  // 更新页面背景
  updateWeatherBackground(weatherMain, iconCode);
  
  const displayCityName = data.userCityName || data.name;
  cityName.textContent = displayCityName;
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  weatherCondition.textContent = data.weather[0].description;
  
  // 设置天气图标
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