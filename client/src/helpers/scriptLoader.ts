const loadScript = (id: string, src: string) => {
    return new Promise<void>((resolve, reject) => {
        if (document.getElementById(id)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.addEventListener('load', event => { resolve(); });
        script.addEventListener('error', reject);
        const noscript = document.getElementsByTagName('noscript')[0];
        noscript.insertAdjacentElement('afterend', script);
    });
};

export default loadScript;