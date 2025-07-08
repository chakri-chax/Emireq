/**
 * Available claim topics.
 *
 * PROPERTY:
 * - intitution DGES code,
 * - course ID
 *
 * KYC:
 * - student name,
 * - student number,
 *
 * POLICY:
 * - certificate URI,
 * - registration certificate number,
 *
 */
const CLAIM_TOPICS = ['PROPERTY', 'KYC', 'POLICY'];

module.exports = {
    CLAIM_TOPICS,
    CLAIM_TOPICS_OBJ: {
        INSTITUTION: CLAIM_TOPICS[0],
        STUDENT: CLAIM_TOPICS[1],
        CERTIFICATE: CLAIM_TOPICS[2]
    }
};
