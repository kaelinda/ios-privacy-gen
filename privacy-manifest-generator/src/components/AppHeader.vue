<template>
  <header class="app-header">
    <h1>Apple 隐私清单生成器</h1>
    <p class="subtitle">为您的 iOS 应用生成符合 Apple 要求的隐私清单文件</p>
  </header>
</template>

<style scoped>
/* 头部样式 - 苹果官网风格 */
.app-header {
  background: var(--gradient-primary);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
  margin-bottom: 0;
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  position: relative;
  z-index: 1;
}

.subtitle {
  margin: 0;
  font-size: 1.25rem;
  opacity: 0.9;
  font-weight: 400;
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (min-width: 1600px) {
  .app-header {
    padding: 5rem 4rem;
  }
  
  .app-header h1 {
    font-size: 3.5rem;
  }
  
  .subtitle {
    font-size: 1.5rem;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .app-header {
    padding: 4rem 3rem;
  }
  
  .app-header h1 {
    font-size: 3.25rem;
  }
  
  .subtitle {
    font-size: 1.375rem;
  }
}

@media (min-width: 1024px) and (max-width: 1199px) {
  .app-header {
    padding: 3rem 2rem;
  }
  
  .app-header h1 {
    font-size: 2.75rem;
  }
  
  .subtitle {
    font-size: 1.25rem;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .app-header {
    padding: 2.5rem 2rem;
  }
  
  .app-header h1 {
    font-size: 2.25rem;
  }
  
  .subtitle {
    font-size: 1.125rem;
  }
}

@media (min-width: 480px) and (max-width: 767px) {
  .app-header {
    padding: 2rem 1.5rem;
  }
  
  .app-header h1 {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 479px) {
  .app-header {
    padding: 1.5rem 1rem;
  }
  
  .app-header h1 {
    font-size: 1.75rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
}
</style>
