Steps to run the project:

1) Clone the repository:
   git clone https://github.com/Grechir/Messenger.git

2) Navigate to the project directory:
   cd Messenger/Project

4) Install dependencies:
   pip install -r requirements.txt

5) Reinstall `channels` to fix the `DEFAULT_CHANNEL_LAYER` issue:
   pip uninstall channels
   pip install channels

6) (Optional) Create a superuser (admin):
   python manage.py createsuperuser

7) Run the server:
   daphne Project.asgi:application

8) Open the application in your browser:
   http://127.0.0.1:8000

Default users:
   - Username: Adam, Password: password
   - Username: Eva, Password: password
