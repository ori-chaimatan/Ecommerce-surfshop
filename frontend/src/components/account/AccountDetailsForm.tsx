'use client';

import { FormField } from '@/shared/components/form-field';
import type { Profile } from '@/lib/account/validate-profile';
import { styles } from './account.styles';
import { texts } from './account-texts';
import { useSaveProfile } from './use-save-profile';

interface AccountDetailsFormProps {
  account: Profile;
  onSaved: (profile: Profile) => void;
}

const SPINNER = <span aria-hidden="true" className={styles.saveSpinner} />;

/** Account Details (design `#acctForm`): name and email, saved to the shopper's Strapi user. */
export function AccountDetailsForm({ account, onSaved }: AccountDetailsFormProps) {
  const { values, errors, status, fieldRefs, setField, submit } = useSaveProfile(account, onSaved);
  const saving = status === 'saving';

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.row}>
        <FormField
          id="account-first-name"
          label={texts.firstName}
          value={values.firstName}
          onChange={(value) => setField('firstName', value)}
          error={errors.firstName}
          autoComplete="given-name"
          ref={(element) => {
            fieldRefs.current.firstName = element;
          }}
        />
        <FormField
          id="account-last-name"
          label={texts.lastName}
          value={values.lastName}
          onChange={(value) => setField('lastName', value)}
          error={errors.lastName}
          autoComplete="family-name"
          ref={(element) => {
            fieldRefs.current.lastName = element;
          }}
        />
      </div>
      <div className={styles.row}>
        <FormField
          id="account-email"
          label={texts.email}
          type="email"
          value={values.email}
          onChange={(value) => setField('email', value)}
          error={errors.email}
          autoComplete="email"
          ref={(element) => {
            fieldRefs.current.email = element;
          }}
        />
      </div>
      <button type="submit" className={styles.save} disabled={saving}>
        {saving && SPINNER}
        <span>{saving ? texts.saving : texts.save}</span>
      </button>
      {status === 'saved' ? (
        <p role="status" className={`${styles.note.base} ${styles.note.saved}`}>
          {texts.saved}
        </p>
      ) : status === 'error' ? (
        <p role="alert" className={`${styles.note.base} ${styles.note.error}`}>
          {texts.saveFailed}
        </p>
      ) : null}
    </form>
  );
}
