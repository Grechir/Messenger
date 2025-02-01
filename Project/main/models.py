from django.db import models
from django.contrib.auth.models import User

class Chat(models.Model):
    name = models.CharField(max_length=64)
    description = models.CharField(max_length=512, blank=True)
    participants = models.ManyToManyField(User)
    is_group = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    content = models.CharField(max_length=4096)
    timestamp = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.sender.name}: {self.content}"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
