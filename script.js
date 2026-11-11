(() => {
    const root = document.documentElement;
    const themeButton = document.getElementById('theme-toggle');
    const menuButton = document.getElementById('menu-toggle');
    const navigation = document.getElementById('nav-links');
    const notice = document.getElementById('interaction-notice');
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileNavigation = window.matchMedia('(max-width: 800px)');
    const navLinks = [...navigation.querySelectorAll('a')];

    const updateThemeLabel = () => {
        const dark = root.dataset.theme === 'dark';
        themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
        themeButton.title = `Switch to ${dark ? 'light' : 'dark'} theme`;
        document.querySelector('meta[name="theme-color"]').content = dark ? '#111111' : '#FAFAF7';
    };
    updateThemeLabel();
    themeButton.hidden = false;
    themeButton.addEventListener('click', () => {
        root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        updateThemeLabel();
        try {
            localStorage.setItem('theme', root.dataset.theme);
            notice.textContent = '';
        } catch (error) {
            console.warn('Unable to save the theme preference.', error);
            notice.textContent = 'Theme changed for this visit. Your browser could not save the preference.';
        }
    });

    const setMenu = (open, restoreFocus = false) => {
        navigation.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        if (open) navLinks[0].focus();
        if (restoreFocus) menuButton.focus();
    };
    menuButton.hidden = false;
    menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    navLinks.forEach(link => link.addEventListener('click', () => {
        const target = document.querySelector(link.hash);
        setMenu(false);
        if (mobileNavigation.matches && target) {
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        }
    }));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.nav') && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
    document.querySelector('.nav').addEventListener('focusout', event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setMenu(false);
    });
    mobileNavigation.addEventListener('change', () => {
        const focusWasInMenu = navigation.contains(document.activeElement);
        setMenu(false, mobileNavigation.matches && focusWasInMenu);
    });
    root.classList.add('nav-ready');

    const now = new Date();
    const currentMonth = now.getFullYear() * 12 + now.getMonth();
    document.querySelectorAll('.experience-duration').forEach(element => {
        const [startYear, startMonth] = element.dataset.startMonth.split('-').map(Number);
        const [endYear, endMonth] = element.dataset.endMonth
            ? element.dataset.endMonth.split('-').map(Number)
            : [now.getFullYear(), now.getMonth() + 1];
        const start = startYear * 12 + startMonth - 1;
        const end = element.dataset.endMonth ? endYear * 12 + endMonth : currentMonth;
        // Completed roles include the listed final month; current roles use elapsed months.
        const months = Math.max(0, end - start);
        const years = Math.floor(months / 12);
        const remainder = months % 12;
        const parts = [];
        if (years) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
        if (remainder) parts.push(`${remainder} ${remainder === 1 ? 'month' : 'months'}`);
        element.textContent = months ? `${parts.join(' ')}` : 'Less than 1 month';
    });

    const sectionIds = new Set(navLinks.map(link => link.hash.slice(1)));
    const sections = [...document.querySelectorAll('main section[id]')].filter(section => sectionIds.has(section.id));
    let ticking = false;
    const markActiveSection = () => {
        const anchorLine = window.innerHeight * .35;
        const reachedEnd = window.scrollY + window.innerHeight >= root.scrollHeight - 4;
        let current = null;
        for (const section of sections) {
            if (section.getBoundingClientRect().top <= anchorLine) current = section.id;
        }
        if (reachedEnd) current = 'contact';
        for (const link of navLinks) {
            if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        }
        ticking = false;
    };
    const scheduleActiveSection = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(markActiveSection);
    };
    document.addEventListener('scroll', scheduleActiveSection, { passive: true });
    window.addEventListener('resize', scheduleActiveSection, { passive: true });
    markActiveSection();

    const projectTabList = document.querySelector('.project-tabs');
    const projectTabs = [...projectTabList.querySelectorAll('[role="tab"]')];
    const professionalPanel = document.getElementById('professional-panel');
    professionalPanel.parentElement.insertBefore(professionalPanel, document.getElementById('personal-panel'));
    projectTabs.forEach(tab => {
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.tabIndex = 0;
    });
    const selectProjectTab = selected => {
        projectTabs.forEach(tab => {
            const active = tab === selected;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
        });
        scheduleActiveSection();
    };
    projectTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectProjectTab(tab));
        tab.addEventListener('keydown', event => {
            let nextIndex;
            if (event.key === 'ArrowRight') nextIndex = (index + 1) % projectTabs.length;
            else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + projectTabs.length) % projectTabs.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = projectTabs.length - 1;
            else return;
            event.preventDefault();
            selectProjectTab(projectTabs[nextIndex]);
            projectTabs[nextIndex].focus();
        });
    });
    selectProjectTab(projectTabs[0]);
    projectTabList.hidden = false;
    root.classList.add('project-tabs-ready');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                if (!motionPreference.matches) {
                    entry.target.classList.add('reveal-in');
                    entry.target.querySelectorAll('.skill-grid li').forEach((skill, index) => {
                        skill.classList.add('reveal-in');
                        skill.style.animationDelay = `${index * 45}ms`;
                    });
                }
                observer.unobserve(entry.target);
            }
        }, { threshold: .08 });
        document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    }

    document.getElementById('year').textContent = String(new Date().getFullYear());
})();
