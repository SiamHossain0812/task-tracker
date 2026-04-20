"""
Management command to heal any User accounts that are missing their
Collaborator or UserProfile (can happen if sync silently failed during
an earlier registration or if users were created via Django admin/shell).

Usage:
    python manage.py heal_user_profiles           # Dry run - show what would be fixed
    python manage.py heal_user_profiles --fix     # Actually fix issues
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from agendas.models import Collaborator, UserProfile


class Command(BaseCommand):
    help = 'Heal User accounts that are missing Collaborator or UserProfile objects.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Actually apply fixes (default is dry-run which only reports issues).',
        )

    def handle(self, *args, **options):
        do_fix = options['fix']
        mode = "FIX" if do_fix else "DRY RUN"

        self.stdout.write(self.style.WARNING(f'\n=== Healing User Profiles [{mode}] ===\n'))

        users_missing_collab = []
        users_missing_profile = []
        orphaned_collabs = []

        all_users = User.objects.all()
        self.stdout.write(f'Total users: {all_users.count()}')
        self.stdout.write(f'Total collaborators: {Collaborator.objects.count()}')
        self.stdout.write(f'Total user profiles: {UserProfile.objects.count()}\n')

        # --- Find users missing Collaborator ---
        for user in all_users:
            try:
                _ = user.collaborator_profile
            except Exception:
                users_missing_collab.append(user)

        # --- Find users missing UserProfile ---
        for user in all_users:
            try:
                _ = user.profile
            except Exception:
                users_missing_profile.append(user)

        # --- Find orphaned Collaborators (no linked User) ---
        orphaned_collabs = list(Collaborator.objects.filter(user__isnull=True))

        # --- Report ---
        if users_missing_collab:
            self.stdout.write(self.style.ERROR(
                f'Found {len(users_missing_collab)} user(s) WITHOUT a Collaborator profile:'
            ))
            for u in users_missing_collab:
                self.stdout.write(f'  - [{u.id}] {u.username} ({u.get_full_name() or "no name"}), email={u.email}')
        else:
            self.stdout.write(self.style.SUCCESS('[OK] All users have a Collaborator profile.'))

        if users_missing_profile:
            self.stdout.write(self.style.ERROR(
                f'Found {len(users_missing_profile)} user(s) WITHOUT a UserProfile:'
            ))
            for u in users_missing_profile:
                self.stdout.write(f'  - [{u.id}] {u.username}')
        else:
            self.stdout.write(self.style.SUCCESS('[OK] All users have a UserProfile.'))

        if orphaned_collabs:
            self.stdout.write(self.style.WARNING(
                f'Found {len(orphaned_collabs)} Collaborator(s) NOT linked to any User:'
            ))
            for c in orphaned_collabs:
                self.stdout.write(f'  - [{c.id}] {c.name}, email={c.email}, phone={c.whatsapp_number}')
        else:
            self.stdout.write(self.style.SUCCESS('[OK] All Collaborators are linked to a User.'))

        if not do_fix:
            self.stdout.write(self.style.WARNING(
                '\nThis was a DRY RUN. Run with --fix to apply corrections.\n'
            ))
            return

        # --- Apply fixes ---
        from agendas.utils import ensure_user_profile_sync

        fixed = 0
        failed = 0

        for user in users_missing_collab:
            self.stdout.write(f'  Fixing missing Collaborator for: {user.username}...')
            try:
                collab = ensure_user_profile_sync(user)
                if collab:
                    self.stdout.write(self.style.SUCCESS(f'    [OK] Created Collaborator [{collab.id}] for {user.username}'))
                    fixed += 1
                else:
                    self.stdout.write(self.style.ERROR(f'    [FAIL] Failed to create Collaborator for {user.username}'))
                    failed += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'    [FAIL] Error: {e}'))
                failed += 1

        for user in users_missing_profile:
            if user not in users_missing_collab:  # Already handled above
                self.stdout.write(f'  Fixing missing UserProfile for: {user.username}...')
                try:
                    ensure_user_profile_sync(user)
                    self.stdout.write(self.style.SUCCESS(f'    [OK] Created UserProfile for {user.username}'))
                    fixed += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'    [FAIL] Error: {e}'))
                    failed += 1

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Healing complete: {fixed} fixed, {failed} failed.'))
        if failed:
            self.stdout.write(self.style.WARNING(
                'Some failures occurred. Check the output above for details.\n'
                'Orphaned Collaborators without a User can be linked manually via /admin/.'
            ))
