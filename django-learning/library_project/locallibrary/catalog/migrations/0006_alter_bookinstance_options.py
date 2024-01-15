# Generated by Django 3.2.6 on 2021-09-06 17:59

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0005_alter_bookinstance_options'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='bookinstance',
            options={'ordering': ['book'], 'permissions': (('can_mark_returned', 'Set book as returned'), ('can_renew', 'Set book return date'))},
        ),
    ]
