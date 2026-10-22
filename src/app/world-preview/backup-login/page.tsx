import MigrateAccountClient from '@/app/migrate-account/MigrateAccountClient';

// Design preview: the optional "add a backup login" page (old X-only accounts).
export default function BackupLoginPreview() {
  return (
    <MigrateAccountClient
      userId="preview"
      xUsername="jbawsa"
      currentEmail={null}
      name="Jeffrey Basa"
    />
  );
}
