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


const API_KEY = 'c9335f859e94a0129860b99edb2727cd';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM元素
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherResult = document.getElementById('weatherResult');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

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
    let data = null;
    for (const searchTerm of searchFormats) {
      const url = `${API_URL}?q=${encodeURIComponent(searchTerm)}&appid=${API_KEY}&units=metric&lang=zh_cn`;
      const response = await fetch(url);
      
      if (response.ok) {
        data = await response.json();
        // 保存用户输入的原始城市名称
        data.userCityName = city;
        break; // 找到有效的搜索结果，退出循环
      } else if (response.status !== 404) {
        // 如果不是404错误，可能是API密钥或其他问题
        throw new Error(`API错误: ${response.status}`);
      }
    }
    
    // 如果所有格式都尝试失败
    if (!data) {
      throw new Error('未找到该城市，请尝试其他名称或使用英文名称');
    }
    
    displayWeather(data);
    
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

// 显示天气数据
function displayWeather(data) {
  // 更新UI显示 - 只显示城市名称，不显示国家代码
  const displayCityName = data.userCityName || data.name;
  cityName.textContent = displayCityName;
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  weatherCondition.textContent = data.weather[0].description;
  
  // 设置天气图标
  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIcon.alt = data.weather[0].description;
  
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