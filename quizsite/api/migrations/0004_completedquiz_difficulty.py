# Generated by Django 5.1.3 on 2024-11-24 21:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_completedquizquestion_marks_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='completedquiz',
            name='difficulty',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]