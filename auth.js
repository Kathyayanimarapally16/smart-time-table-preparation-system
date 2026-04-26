document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if(registerForm) {
        registerForm.onsubmit = (e) => {
            // Logic is already handled inside the register.html <script>
            // This file is now a backup or can be left empty.
        };
    }
});