Steps to run the project:

1) Clone the repository:<br />
   git clone https://github.com/Grechir/Messenger.git

2) Navigate to the project directory:<br />
   cd Messenger/Project

4) Install dependencies:<br />
   pip install -r requirements.txt

5) Reinstall `channels` to fix the `DEFAULT_CHANNEL_LAYER` issue:<br />
   pip uninstall channels<br />
   pip install channels

6) (Optional) Create a superuser (admin):<br />
   python manage.py createsuperuser

7) Run the server:<br />
   daphne Project.asgi:application

8) Open the application in your browser:<br />
   http://127.0.0.1:8000

Default users:<br />
   - Username: Adam, Password: password<br />
   - Username: Eva, Password: password
